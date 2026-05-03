import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup } from "pdf-lib";
import { PrismaClient } from "@prisma/client";
// 📍 NEW: Import the secure session checkers
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { message, history, pdfData } = await req.json();
    const todayDate = new Date().toLocaleDateString('en-GB');
    
    // 📍 NEW: Securely get the email from the encrypted cookie instead of headers!
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!pdfData) {
      return NextResponse.json({ text: "Please upload a PDF form first to start the interview!" }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfData, 'base64');


    const prompt = `
      You are Doctor Bank, a strict, literal data-entry AI. You ONLY know the exact text printed on the attached PDF.

      🎭 PERSONA & TONE:
      - Friendly, patient, and extremely simple. 

      🔄 MODES OF OPERATION:
      The user was just asked to choose: "1. Ask specific questions" or "2. Start an interview".
      - IF THEY CHOOSE 1: Enter Q&A mode. Answer their questions. DO NOT ask them for their name.
      - IF THEY CHOOSE 2: Enter Interview mode. ALWAYS get the user's name first. Then, proceed to ask EXACTLY ONE question per turn to fill out the form.

      🛑 CRITICAL SYSTEM FACTS:
      - Date: ${todayDate}. (ALREADY FILLED)
      - 🚫 SENSITIVE DATA: NEVER ask for Bank Account Number, NIC, or Passport Number. Skip them completely.

      🗣️ CONVERSATION RULES:
      - Ask EXACTLY ONE question per turn.
      - 🔢 NUMBERED OPTIONS: ALWAYS add numbers to options (1, 2, 3...).
      - 💰 CALCULATIONS: Multiply Monthly Income by 12 for Annual. Calculate Profit Margin from Income/Expenses.
      - 📥 MID-CHAT DOWNLOAD: If user asks to download early, reply with PARTIAL_DOWNLOAD followed by JSON.

      🏁 EXIT CONDITION (STRICT):
      - As soon as you collect the last required piece of info, IMMEDIATELY generate the final output.
      - Output FINISHED_INTERVIEW followed by raw JSON. NO markdown blocks (\`\`\`json).
    `;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: prompt 
    });

    const formattedHistory = history.map((msg: { role: string; text: string }) => ({
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
      let filledPdfBase64 = null;
      const jsonStartIndex = responseText.indexOf('{');
      const jsonEndIndex = responseText.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonString = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
        try {
          const extractedData = JSON.parse(jsonString);
          console.log("🧠 AI Extracted Data:", extractedData);

          // 📍 NEW: SMARTER DATABASE SAVING LOGIC!
          if (isFinished && userEmail) {
            try {
              // 1. Check if the user exists
              let user = await prisma.user.findUnique({ where: { email: userEmail } });
              
              // 2. If they don't exist, create them in the database!
              if (!user) {
                console.log("🆕 User not found. Creating new user account in database...");
                user = await prisma.user.create({
                  data: { email: userEmail }
                });
              }

              // 3. Save the application data securely attached to their account
              await prisma.application.create({
                data: {
                  userId: user.id,
                  pdfName: "Bank Application", 
                  data: extractedData
                }
              });
              console.log("✅ Successfully saved to PostgreSQL!");
              
            } catch (dbError) {
              console.error("❌ Failed to save to database:", dbError);
            }
          }

          const pdfDoc = await PDFDocument.load(pdfBuffer);
          const form = pdfDoc.getForm();
          const fields = form.getFields();
          
          for (const field of fields) {
            const fieldName = field.getName();
            const matchingKey = Object.keys(extractedData).find(k => {
              const cleanFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanDataKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanDataValue = String(extractedData[k]).toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanFieldName === cleanDataKey || cleanFieldName === cleanDataValue;
            });

            if (matchingKey) {
              try {
                if (field instanceof PDFTextField) {
                  field.setText(String(extractedData[matchingKey]));
                } else if (field instanceof PDFCheckBox) {
                  const val = String(extractedData[matchingKey]).toLowerCase().replace(/[^a-z0-9]/g, '');
                  const cleanFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
                  if (val === 'true' || val === 'yes' || val === 'x' || val === cleanFieldName) {
                    field.check(); 
                  }
                } else if (field instanceof PDFRadioGroup) {
                  field.select(String(extractedData[matchingKey]));
                }
              } catch (e) {
                console.error(`Failed to fill field ${fieldName}:`, e);
              }
            }
          }

          const pdfBytes = await pdfDoc.save();
          filledPdfBase64 = Buffer.from(pdfBytes).toString('base64');
          
          responseText = responseText
            .replace(jsonString, "")
            .replace("FINISHED_INTERVIEW", "")
            .replace("PARTIAL_DOWNLOAD", "")
            .replace(/```json/ig, "")
            .replace(/```/g, "")
            .trim();
        } catch (err) {
          console.error("❌ Error parsing JSON or filling PDF:", err);
        }
      }

      return NextResponse.json({ 
        text: responseText, 
        pdfBase64: filledPdfBase64 
      });
    }

    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ text: "Error processing request." }, { status: 500 });
  }
}
