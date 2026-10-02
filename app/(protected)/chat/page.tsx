"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopNav from "@/components/TopNav";

type Message = {
  role: "user" | "model";
  text: string;
};

function ChatMainLogic() {
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("id");
  
  // Track the ID in state so new chats can get an ID on the first message
  const [chatId, setChatId] = useState<string | null>(urlChatId);
  const [isFetchingHistory, setIsFetchingHistory] = useState(!!urlChatId);

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; date: string }[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "What Would You Like to Do?\n\n1. Start an Interview and Fill\n2. Ask a Specified Problem" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (urlChatId) {
      const loadSavedChat = async () => {
        try {
          const res = await fetch(`/api/applications?id=${urlChatId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.chatHistory) setMessages(data.chatHistory); 
            if (data.pdfData) {
               setPdfBase64(data.pdfData);
               setUploadedFiles([{ 
                 name: `${data.pdfName}.pdf`, 
                 date: new Date(data.createdAt).toLocaleDateString('en-GB') 
               }]);
            }
          }
        } catch (error) {
          console.error("Failed to load past chat:", error);
        } finally {
          setIsFetchingHistory(false);
        }
      };
      loadSavedChat();
    } else {
      setIsFetchingHistory(false);
    }
  }, [urlChatId]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!pdfBase64) {
      alert("Please upload a PDF form first to start!");
      return;
    }

    const newUserMessage: Message = { role: "user", text: inputText };
    const currentHistory = [...messages]; 
    setMessages(prev => [...prev, newUserMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: chatId, // Pass the current ID to the backend
          message: newUserMessage.text,
          pdfData: pdfBase64,
          history: currentHistory, 
        }),
      });

      const data = await res.json();

      // If the server created a new chat record, save its ID
      if (data.applicationId && !chatId) {
        setChatId(data.applicationId);
        window.history.replaceState(null, '', `/chat?id=${data.applicationId}`);
      }

      if (data.text) {
        setMessages(prev => [...prev, { role: "model", text: data.text }]);
      }

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
    <>
      <TopNav />
      <div className="min-h-screen bg-white flex items-center justify-center p-8 pt-32">
        <div className="w-full max-w-[1300px] h-[750px] flex gap-8 border border-gray-200 rounded-[50px] p-8 pb-12 relative overflow-hidden">
          
          {isFetchingHistory && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-[50px]">
              <div className="w-16 h-16 border-4 border-[#D9D9D9] border-t-brand-primary rounded-full animate-spin"></div>
              <h2 className="mt-6 text-2xl font-bold text-black">Retrieving Documents</h2>
              <p className="text-gray-600 mt-2 font-medium">Doctor Bank is securely loading your chat history...</p>
            </div>
          )}

          {/* LEFT SIDEBAR */}
          <div className="w-80 flex flex-col gap-6 relative z-10 pt-4">
            <div className="bg-[#D9D9D9] rounded-[30px] p-8 text-center shadow-sm">
              <p className="text-[11px] text-gray-500 italic mb-8 px-2 font-medium">
                (*Note : Upload Your Banking Applications, Loan & Financing Documents.)
              </p>
              <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-brand-primary text-white font-bold text-lg py-3 px-8 rounded-full hover:bg-brand-primary/90 transition-colors shadow-md w-[80%]"
              >
                Upload PDF
              </button>
            </div>

            <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 mt-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-[#F3F4F6] rounded-full px-5 py-3.5 flex items-center justify-between shadow-sm border border-gray-100">
                  <span className="text-black font-bold text-sm truncate max-w-[140px]">{file.name}</span>
                  <span className="text-gray-400 text-xs">{file.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR CHAT WINDOW */}
          <div className="flex-1 bg-[#F0F2F0] rounded-[40px] relative p-8 flex flex-col z-10">
            <div className="flex-1 overflow-y-auto flex flex-col gap-6 mb-6 pr-4 pt-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div 
                    className={`max-w-[70%] px-6 py-4 rounded-[20px] text-[15px] whitespace-pre-wrap font-semibold
                      ${msg.role === "user" 
                        ? "bg-transparent border border-brand-primary text-brand-primary rounded-tr-sm"
                        : "bg-white text-black shadow-sm rounded-tl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="text-gray-400 text-sm italic py-2">Doctor Bank is Typing...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="w-full relative mt-auto">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type Your Message Here"
                className="w-full bg-transparent border border-gray-300 rounded-full pl-6 pr-16 py-4 outline-none focus:border-brand-primary transition-colors text-gray-700 font-medium"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <ChatMainLogic />
    </Suspense>
  );
}
