import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import {
  PDFCheckBox,
  PDFDocument,
  PDFRadioGroup,
  PDFTextField,
} from "pdf-lib";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { authOptions } from "../auth/[...nextauth]/route";

// --- THE PRISMA FIX ---

// ----------------------

type ChatHistoryMessage = {
  role: string;
  text: string;
};

type ExtractedData = Prisma.InputJsonObject;

const normalizeValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function POST(req: Request) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { text: "Server configuration error." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as {
      history?: ChatHistoryMessage[];
      message?: string;
      pdfData?: string;
    };

    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const pdfData = typeof body.pdfData === "string" ? body.pdfData : "";
    const history = Array.isArray(body.history) ? body.history : [];
    const todayDate = new Date().toLocaleDateString("en-GB");

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!message) {
      return NextResponse.json(
        { text: "Please enter a message to continue." },
        { status: 400 },
      );
    }

    if (!pdfData) {
      return NextResponse.json(
        { text: "Please upload a PDF form first to start the interview!" },
        { status: 400 },
      );
    }

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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: prompt,
    });

    const formattedHistory = history
      .filter(
        (msg): msg is ChatHistoryMessage =>
          !!msg &&
          typeof msg.role === "string" &&
          typeof msg.text === "string",
      )
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
      formattedHistory.unshift({
        role: "user",
        parts: [{ text: "Hello! I have uploaded a PDF form. Please analyze it." }],
      });
    }

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage([
      { inlineData: { data: pdfData, mimeType: "application/pdf" } },
      message,
    ]);

    let responseText = result.response.text();
    const isFinished = responseText.includes("FINISHED_INTERVIEW");
    const isPartialDownload = responseText.includes("PARTIAL_DOWNLOAD");

    if (isFinished || isPartialDownload) {
      let filledPdfBase64: string | null = null;
      const jsonStartIndex = responseText.indexOf("{");
      const jsonEndIndex = responseText.lastIndexOf("}");

      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonString = responseText.substring(
          jsonStartIndex,
          jsonEndIndex + 1,
        );

        try {
          const extractedData = JSON.parse(jsonString) as ExtractedData;
          console.log("AI extracted data:", extractedData);

          if (isFinished && userEmail) {
            try {
              let user = await prisma.user.findUnique({
                where: { email: userEmail },
              });

              if (!user) {
                console.log("User not found. Creating a new user record...");
                user = await prisma.user.create({
                  data: { email: userEmail },
                });
              }

              await prisma.application.create({
                data: {
                  userId: user.id,
                  pdfName: "Bank Application",
                  data: extractedData,
                },
              });
              console.log("Successfully saved to PostgreSQL.");
            } catch (dbError) {
              console.error("Failed to save to database:", dbError);
            }
          }

          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const form = pdfDoc.getForm();
          const fields = form.getFields();

          for (const field of fields) {
            const fieldName = field.getName();
            const matchingKey = Object.keys(extractedData).find((key) => {
              const cleanFieldName = normalizeValue(fieldName);
              const cleanDataKey = normalizeValue(key);
              const cleanDataValue = normalizeValue(String(extractedData[key]));

              return (
                cleanFieldName === cleanDataKey ||
                cleanFieldName === cleanDataValue
              );
            });

            if (!matchingKey) {
              continue;
            }

            try {
              if (field instanceof PDFTextField) {
                field.setText(String(extractedData[matchingKey]));
              } else if (field instanceof PDFCheckBox) {
                const value = normalizeValue(
                  String(extractedData[matchingKey]),
                );
                const cleanFieldName = normalizeValue(fieldName);

                if (
                  value === "true" ||
                  value === "yes" ||
                  value === "x" ||
                  value === cleanFieldName
                ) {
                  field.check();
                }
              } else if (field instanceof PDFRadioGroup) {
                field.select(String(extractedData[matchingKey]));
              }
            } catch (fieldError) {
              console.error(`Failed to fill field ${fieldName}:`, fieldError);
            }
          }

          const pdfBytes = await pdfDoc.save();
          filledPdfBase64 = Buffer.from(pdfBytes).toString("base64");

          responseText = responseText
            .replace(jsonString, "")
            .replace("FINISHED_INTERVIEW", "")
            .replace("PARTIAL_DOWNLOAD", "")
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
        } catch (parseError) {
          console.error("Error parsing JSON or filling PDF:", parseError);
        }
      }

      return NextResponse.json({
        text: responseText,
        pdfBase64: filledPdfBase64,
      });
    }

    return NextResponse.json({ text: responseText });
  } catch (error: unknown) {
    console.error("API error:", error);
    return NextResponse.json(
      { text: "Error processing request." },
      { status: 500 },
    );
  }
}