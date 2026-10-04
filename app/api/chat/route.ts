import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/db";
import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField } from "pdf-lib";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { FREE_CHAT_LIMIT, FREE_MESSAGE_LIMIT, isProUser } from "@/lib/plans";
import { buildFieldMapInstructions, buildProSystemPrompt, buildSystemPrompt } from "@/lib/systemPrompt";
import { RATES_LAST_UPDATED, buildRatesContext } from "@/lib/bankRates";
import { getModelConfig, isModelId } from "@/lib/aiModels";
import { AIProviderError, chatCompletion, type ChatMessage } from "@/lib/openaiCompat";
import { buildFieldMap } from "@/lib/pdfFields";

type ChatHistoryMessage = { role: string; text: string };
type ExtractedData = Record<string, string | number | boolean | null>;

const normalizeValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// Turns whatever is stored/sent into a clean list of { role, text } messages
const toHistory = (value: unknown): ChatHistoryMessage[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ChatHistoryMessage => {
    const msg = item as Partial<ChatHistoryMessage> | null;
    return !!msg && typeof msg.role === "string" && typeof msg.text === "string";
  });
};

const limitResponse = (reason: "FREE_CHAT_LIMIT" | "FREE_MESSAGE_LIMIT") =>
  NextResponse.json(
    {
      text:
        reason === "FREE_CHAT_LIMIT"
          ? `You've used your free chat. The Free plan includes ${FREE_CHAT_LIMIT} chat with up to ${FREE_MESSAGE_LIMIT} messages. Upgrade to Full House for unlimited chats and messages.`
          : `You've reached the ${FREE_MESSAGE_LIMIT}-message limit for this chat on the Free plan. Upgrade to Full House to keep going.`,
      limitReached: true,
      reason,
    },
    { status: 403 }
  );

export async function POST(req: Request) {
  try {
    // Plan limits can only be enforced for logged-in users
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ text: "Please log in to continue." }, { status: 401 });

    const body = (await req.json()) as {
      applicationId?: string | null;
      history?: ChatHistoryMessage[];
      message?: string;
      pdfData?: string;
      model?: string;
    };

    // Which AI the user picked in the chat (defaults to Gemini, so old clients keep working)
    const modelConfig = getModelConfig(isModelId(body.model) ? body.model : "gemini");
    if (!modelConfig.apiKey) {
      return NextResponse.json({ text: "That AI model isn't available right now. Please pick another one." }, { status: 400 });
    }

    const applicationId = body.applicationId || null;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pdfData = typeof body.pdfData === "string" ? body.pdfData : "";
    const todayDate = new Date().toLocaleDateString("en-GB");

    if (!message) return NextResponse.json({ text: "Please enter a message to continue." }, { status: 400 });

    const user =
      (await prisma.user.findUnique({ where: { email: userEmail } })) ??
      (await prisma.user.create({ data: { email: userEmail } }));
    const isPro = isProUser(user);

    if (user.suspended) {
      return NextResponse.json({ text: "Your account has been suspended. Please contact support." }, { status: 403 });
    }

    // Free users must upload a PDF. Pro users can chat without one (general banking assistant mode).
    if (!pdfData && !isPro) {
      return NextResponse.json({ text: "Please upload a PDF form first to start the interview!" }, { status: 400 });
    }

    // Load the existing chat from the database (never trust the browser for ownership or counts)
    let application: { id: string; chatHistory: unknown; pdfData: string | null } | null = null;
    if (applicationId) {
      application = await prisma.application.findFirst({
        where: { id: applicationId, userId: user.id },
        select: { id: true, chatHistory: true, pdfData: true },
      });
      if (!application) return NextResponse.json({ text: "Chat not found." }, { status: 404 });
    }

    const storedHistory = application ? toHistory(application.chatHistory) : [];
    const messagesBefore = storedHistory.filter((m) => m.role === "user").length;

    // --- FREE PLAN LIMITS ---
    if (!isPro) {
      if (!application && user.chatsStarted >= FREE_CHAT_LIMIT) return limitResponse("FREE_CHAT_LIMIT");
      if (application && messagesBefore >= FREE_MESSAGE_LIMIT) return limitResponse("FREE_MESSAGE_LIMIT");
    }

    // Existing chats use the saved history; a new chat only keeps the opening greeting
    const history = application
      ? storedHistory
      : toHistory(body.history).filter((m) => m.role === "model").slice(0, 1);

    const pdfBuffer = Buffer.from(pdfData, "base64");

    // Same rules for every model: one shared prompt (see lib/systemPrompt.ts)
    const prompt = buildSystemPrompt(todayDate);

    let responseText: string;

    if (!pdfData) {
      // --- PRO, NO PDF: normal banking assistant that can read the curated Sri Lankan rates ---
      const proPrompt = buildProSystemPrompt(todayDate, buildRatesContext(), RATES_LAST_UPDATED);
      try {
        if (modelConfig.kind === "gemini") {
          const genAI = new GoogleGenerativeAI(modelConfig.apiKey);
          const model = genAI.getGenerativeModel({ model: modelConfig.model, systemInstruction: proPrompt });
          const formatted = history.map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          }));
          // Gemini history must start with a user turn
          if (formatted.length > 0 && formatted[0].role === "model") {
            formatted.unshift({ role: "user", parts: [{ text: "Hello!" }] });
          }
          const chat = model.startChat({ history: formatted });
          responseText = (await chat.sendMessage(message)).response.text();
        } else {
          const messages: ChatMessage[] = [{ role: "system", content: proPrompt }];
          if (history.length > 0 && history[0].role !== "user") messages.push({ role: "user", content: "Hello!" });
          for (const msg of history) {
            messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
          }
          messages.push({ role: "user", content: message });
          responseText = await chatCompletion({
            baseUrl: modelConfig.baseUrl!,
            apiKey: modelConfig.apiKey!,
            model: modelConfig.model,
            messages,
            temperature: 0.4,
          });
        }
      } catch (err) {
        console.error(`${modelConfig.id} error:`, err);
        const busy = err instanceof AIProviderError && (err.status === 429 || err.status === 413);
        return NextResponse.json(
          {
            text: busy
              ? "This AI model is busy or has reached its limit for now. Please switch to another model using the selector above, or try again in a minute."
              : "This AI model couldn't answer right now. Please switch to another model or try again.",
            modelBusy: true,
          },
          { status: busy ? 429 : 502 }
        );
      }
    } else if (modelConfig.kind === "gemini") {
      // --- GEMINI: reads the PDF file directly (unchanged behaviour) ---
      const genAI = new GoogleGenerativeAI(modelConfig.apiKey);
      const model = genAI.getGenerativeModel({
        model: modelConfig.model,
        systemInstruction: prompt,
      });

      const formattedHistory = history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
        formattedHistory.unshift({ role: "user", parts: [{ text: "Hello! I have uploaded a PDF form. Please analyze it." }] });
      }

      const chat = model.startChat({ history: formattedHistory });
      const result = await chat.sendMessage([{ inlineData: { data: pdfData, mimeType: "application/pdf" } }, message]);
      responseText = result.response.text();
    } else {
      // --- MISTRAL: reads the PDF as a document (OCR) + gets a field map so answers land in the right boxes ---
      try {
        const fieldMap = await buildFieldMap(pdfBuffer);

        const buildMessages = (attachPdf: boolean): ChatMessage[] => {
          const messages: ChatMessage[] = [
            { role: "system", content: prompt + buildFieldMapInstructions(fieldMap, attachPdf) },
          ];
          if (history.length > 0 && history[0].role !== "user") {
            messages.push({ role: "user", content: "Hello! I have uploaded a PDF form. Please analyze it." });
          }
          for (const msg of history) {
            messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
          }
          messages.push({
            role: "user",
            content: attachPdf
              ? [
                  { type: "text", text: message },
                  { type: "document_url", document_url: `data:application/pdf;base64,${pdfData}` },
                ]
              : message,
          });
          return messages;
        };

        const call = (attachPdf: boolean) =>
          chatCompletion({
            baseUrl: modelConfig.baseUrl!,
            apiKey: modelConfig.apiKey!,
            model: modelConfig.model,
            messages: buildMessages(attachPdf),
          });

        try {
          responseText = await call(true);
        } catch (err) {
          // If Mistral refuses or rate-limits the attached PDF (plan, size or token limits on the free plan),
          // wait a moment and answer again using the field map alone (far fewer tokens, no document OCR)
          const retryable = err instanceof AIProviderError && [400, 402, 403, 413, 415, 422, 429].includes(err.status);
          if (!retryable) throw err;
          console.error("Mistral rejected the attached PDF, retrying with the field map only:", err);
          if (err.status === 429) await new Promise((resolve) => setTimeout(resolve, 2200));
          responseText = await call(false);
        }
      } catch (err) {
        console.error(`${modelConfig.id} error:`, err);
        const busy = err instanceof AIProviderError && (err.status === 429 || err.status === 413);
        return NextResponse.json(
          {
            text: busy
              ? "This AI model is busy or has reached its free limit for now. Please switch to another model using the selector above, or try again in a minute."
              : "This AI model couldn't answer right now. Please switch to another model or try again.",
            modelBusy: true,
          },
          { status: busy ? 429 : 502 }
        );
      }
    }

    const isFinished = responseText.includes("FINISHED_INTERVIEW");
    const isPartialDownload = responseText.includes("PARTIAL_DOWNLOAD");

    let filledPdfBase64: string | null = null;
    let extractedData: ExtractedData = {};

    // Handle extraction and PDF filling if finished
    if (isFinished || isPartialDownload) {
      const jsonStartIndex = responseText.indexOf("{");
      const jsonEndIndex = responseText.lastIndexOf("}");

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);

        try {
          extractedData = JSON.parse(jsonString) as ExtractedData;
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const form = pdfDoc.getForm();
          const fields = form.getFields();

          for (const field of fields) {
            const fieldName = field.getName();
            const matchingKey = Object.keys(extractedData).find((key) => {
              const cleanFieldName = normalizeValue(fieldName);
              return cleanFieldName === normalizeValue(key) || cleanFieldName === normalizeValue(String(extractedData[key]));
            });

            if (!matchingKey) continue;

            try {
              if (field instanceof PDFTextField) field.setText(String(extractedData[matchingKey]));
              else if (field instanceof PDFCheckBox) {
                const val = normalizeValue(String(extractedData[matchingKey]));
                if (["true", "yes", "x", normalizeValue(fieldName)].includes(val)) field.check();
              } else if (field instanceof PDFRadioGroup) field.select(String(extractedData[matchingKey]));
            } catch (err) { console.error(`Failed to fill field ${fieldName}:`, err); }
          }

          const pdfBytes = await pdfDoc.save();
          filledPdfBase64 = Buffer.from(pdfBytes).toString("base64");

          responseText = responseText.replace(jsonString, "").replace("FINISHED_INTERVIEW", "").replace("PARTIAL_DOWNLOAD", "").replace(/```json/gi, "").replace(/```/g, "").trim();
        } catch (err) { console.error("Error parsing JSON:", err); }
      }
    }

    // --- DATABASE CONTINUOUS SAVE LOGIC ---
    let currentAppId: string | null = application?.id ?? null;
    const fullChatHistory: ChatHistoryMessage[] = [
      ...history,
      { role: "user", text: message },
      { role: "model", text: responseText },
    ];

    const docName = extractedData["Business Name"]
      ? String(extractedData["Business Name"])
      : !pdfData
      ? "AI Banking Chat"
      : (isFinished ? "Completed Bank Application" : "Bank Application - In Progress");

    try {
      if (application) {
        // Update the history of the ongoing chat
        await prisma.application.update({
          where: { id: application.id },
          data: {
            chatHistory: fullChatHistory,
            // A Pro chat that started without a PDF keeps the PDF once the user uploads one
            ...(pdfData && !isFinished && !application.pdfData ? { pdfData, pdfName: "Bank Application - In Progress" } : {}),
            ...(isFinished ? {
              data: extractedData,
              pdfName: docName,
              pdfData: filledPdfBase64 || pdfData,
            } : {}),
          },
        });
      } else {
        // First message: claim the chat slot and create the record in one transaction.
        // For Free users the slot is only claimed if they are still under the limit,
        // so two simultaneous requests can't both create a chat.
        const newApp = await prisma.$transaction(async (tx) => {
          const claimed = await tx.user.updateMany({
            where: isPro ? { id: user.id } : { id: user.id, chatsStarted: { lt: FREE_CHAT_LIMIT } },
            data: { chatsStarted: { increment: 1 } },
          });
          if (claimed.count === 0) return null;

          return tx.application.create({
            data: {
              userId: user.id,
              pdfName: docName,
              data: isFinished ? extractedData : {},
              chatHistory: fullChatHistory,
              pdfData: pdfData ? (isFinished ? (filledPdfBase64 || pdfData) : pdfData) : null,
            },
            select: { id: true },
          });
        });

        if (!newApp) return limitResponse("FREE_CHAT_LIMIT");
        currentAppId = newApp.id;
      }
    } catch (dbError) {
      console.error("DB Save Error:", dbError);
    }

    return NextResponse.json({
      text: responseText,
      pdfBase64: filledPdfBase64,
      applicationId: currentAppId, // Send ID back to frontend so it doesn't create dupes
      usage: isPro ? null : { messagesUsed: messagesBefore + 1, messagesLimit: FREE_MESSAGE_LIMIT },
    });

  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json({ text: "Error processing request." }, { status: 500 });
  }
}