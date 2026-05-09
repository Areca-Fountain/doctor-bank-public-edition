"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Define the structure of our chat messages based on your route.ts
type Message = {
  role: "user" | "model";
  text: string;
};

export default function ChatPage() {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; date: string }[]>([]);
  
  // --- NEW CHAT STATES ---
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "What Would You Like to Do?\n\n1. Start an Interview and Fill\n2. Ask a Specific Problem" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setPdfBase64(base64String);
        setUploadedFiles(prev => [...prev, { name: file.name, date: new Date().toLocaleDateString('en-GB') }]);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // --- NEW: SEND MESSAGE TO GEMINI ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!pdfBase64) {
      alert("Please upload a PDF form first to start!");
      return;
    }

    // 1. Add User's message to UI immediately
    const newUserMessage: Message = { role: "user", text: inputText };
    const currentHistory = [...messages]; // Save history for the API BEFORE adding the new message
    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // 2. Call your route.ts API (Assuming it's located at app/api/chat/route.ts)
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newUserMessage.text,
          pdfData: pdfBase64,
          history: currentHistory, // Send previous messages so Gemini remembers
        }),
      });

      const data = await res.json();

      // 3. Add AI's response to UI
      if (data.text) {
        setMessages(prev => [...prev, { role: "model", text: data.text }]);
      }

      // 4. Download the filled PDF if Gemini finished the form!
      if (data.pdfBase64) {
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = "Completed_Bank_Application.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setMessages(prev => [...prev, { role: "model", text: "🎉 I have finished filling out your form! The completed PDF is downloading now." }]);
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
      
      <div className="w-full max-w-[1200px] h-[800px] flex gap-6">
        
        {/* LEFT SIDEBAR (Unchanged) */}
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-[#dcdfdc]/80 rounded-[30px] p-6 text-center shadow-sm">
            <p className="text-xs text-gray-500 italic mb-6">
              (*Note : Upload Your Banking Applications, Loan & Financing Documents.)
            </p>
            <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="bg-brand-primary text-white font-bold text-lg py-3 px-8 rounded-full hover:bg-brand-primary/90 transition-colors shadow-md w-full">
              Upload PDF
            </button>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="bg-[#f0f2f0] rounded-full px-5 py-3 flex items-center justify-between shadow-sm">
                <span className="text-brand-primary font-bold text-sm truncate max-w-[140px]">{file.name}</span>
                <span className="text-gray-400 text-xs">{file.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- UPDATED: RIGHT SIDEBAR CHAT WINDOW --- */}
        <div className="flex-1 bg-[#f0f2f0] rounded-[40px] shadow-sm border border-gray-200 relative p-8 flex flex-col">
          
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[80%] px-6 py-4 rounded-[25px] text-sm md:text-base whitespace-pre-wrap
                    ${msg.role === "user" 
                      ? "bg-transparent border border-[#011F4B] text-[#011F4B] rounded-tr-sm" 
                      : "bg-white text-[#011F4B] shadow-sm font-semibold rounded-tl-sm"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="text-gray-400 text-sm italic py-2">Doctor Bank is Typing...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="w-full relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type Your Message Here"
              className="w-full bg-transparent border border-gray-300 rounded-full px-6 py-4 outline-none focus:border-[#011F4B] transition-colors text-gray-700"
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#011F4B] hover:bg-[#011F4B]/90 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}