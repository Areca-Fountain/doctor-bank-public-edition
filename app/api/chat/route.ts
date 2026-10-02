import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/db";
import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField } from "pdf-lib";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { FREE_CHAT_LIMIT, FREE_MESSAGE_LIMIT, isProUser } from "@/lib/plans";

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
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) return NextResponse.json({ text: "Server configuration error." }, { status: 500 });

    // Plan limits can only be enforced for logged-in users
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return NextResponse.json({ text: "Please log in to continue." }, { status: 401 });

    const body = (await req.json()) as {
      applicationId?: string | null;
      history?: ChatHistoryMessage[];
      message?: string;
      pdfData?: string;
    };

    const applicationId = body.applicationId || null;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pdfData = typeof body.pdfData === "string" ? body.pdfData : "";
    const todayDate = new Date().toLocaleDateString("en-GB");

    if (!message) return NextResponse.json({ text: "Please enter a message to continue." }, { status: 400 });
    if (!pdfData) return NextResponse.json({ text: "Please upload a PDF form first to start the interview!" }, { status: 400 });

    const user =
      (await prisma.user.findUnique({ where: { email: userEmail } })) ??
      (await prisma.user.create({ data: { email: userEmail } }));
    const isPro = isProUser(user);

    // Load the existing chat from the database (never trust the browser for ownership or counts)
    let application: { id: string; chatHistory: unknown } | null = null;
    if (applicationId) {
      application = await prisma.application.findFirst({
        where: { id: applicationId, userId: user.id },
        select: { id: true, chatHistory: true },
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
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    const prompt = `
      You are Doctor Bank, a strict, literal data-entry AI. You only know the exact text printed on the attached PDF.

      Persona and tone:
      - Friendly, patient, and extremely simple.

      Modes of operation:
      The user was just asked to choose: "1. Ask specific questions" or "2. Start an interview".
      - If they choose 1: Enter Q&A mode. Answer their questions. Do not ask for their name.
      - If they choose 2: Enter interview mode. Always get the user's name first. Then ask exactly one question per turn to fill out the form.

      Critical system facts:
      - Date: ${todayDate}. (already filled)
      - Sensitive data: Never ask for bank account number, NIC, or passport number. Skip them completely.

      Conversation rules:
      - Ask exactly one question per turn.
      - Numbered options: Always add numbers to options (1, 2, 3...).
      - Calculations: Multiply monthly income by 12 for annual. Calculate profit margin from income and expenses.
      - Mid-chat download: If the user asks to download early, reply with PARTIAL_DOWNLOAD followed by JSON.

      Exit condition:
      - As soon as you collect the last required piece of info, immediately generate the final output.
      - Output FINISHED_INTERVIEW followed by raw JSON. Do not use markdown code fences.
    `;

    // Set GEMINI_MODEL in .env.local to change the model without editing code
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
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

    let responseText = result.response.text();
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
      : (isFinished ? "Completed Bank Application" : "Bank Application - In Progress");

    try {
      if (application) {
        // Update the history of the ongoing chat
        await prisma.application.update({
          where: { id: application.id },
          data: {
            chatHistory: fullChatHistory,
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
              pdfData: isFinished ? (filledPdfBase64 || pdfData) : pdfData,
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