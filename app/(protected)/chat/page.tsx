"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "@/components/TopNav";
import UsageMeter, { type Usage } from "@/components/UsageMeter";
import { useInputMode } from "@/lib/useInputMode";

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
  const [limitReached, setLimitReached] = useState(false);
  const [usageTick, setUsageTick] = useState(0); // bump to reload the counter
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const { isTouch } = useInputMode();

  useEffect(() => {
    // block: "nearest" scrolls only the chat box, never the whole page
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  // Keyboard users get the cursor in the message box right away; on touch screens we do not,
  // because it would pop the on-screen keyboard over the conversation
  useEffect(() => {
    if (!isTouch && !isFetchingHistory && !isLoading && !limitReached) messageInputRef.current?.focus();
  }, [isTouch, isFetchingHistory, isLoading, limitReached]);

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

  // Lock the input when the Free allowance is used up (the server enforces this too)
  const handleUsage = (u: Usage) => {
    if (u.plan === "PRO") {
      setLimitReached(false);
      return;
    }
    setLimitReached(chatId ? u.messagesUsed >= u.messagesLimit : u.chatsUsed >= u.chatsLimit);
  };

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

      if (data.limitReached) setLimitReached(true);
      setUsageTick((t) => t + 1); // refresh the counter after every message

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

  const latestFile = uploadedFiles[uploadedFiles.length - 1];

  return (
    <>
      <TopNav />
      {/* dvh = the visible height on phones (excludes the browser address bar), so the input is never hidden */}
      <div className="min-h-dvh bg-white flex items-start md:items-center justify-center px-3 sm:px-6 md:px-8 pt-[4.75rem] md:pt-32 pb-3 md:pb-8">
        <div className="w-full max-w-[1300px] h-[calc(100dvh-5.75rem)] md:h-[750px] flex flex-col md:flex-row gap-3 md:gap-8 border border-gray-200 rounded-3xl md:rounded-[50px] p-3 md:p-8 md:pb-12 relative overflow-hidden">

          {isFetchingHistory && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl md:rounded-[50px] px-6 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#D9D9D9] border-t-brand-primary rounded-full animate-spin"></div>
              <h2 className="mt-6 text-xl md:text-2xl font-bold text-black">Retrieving Documents</h2>
              <p className="text-gray-600 mt-2 font-medium text-sm md:text-base">Doctor Bank is securely loading your chat history...</p>
            </div>
          )}

          {/* hidden file picker, shared by the phone bar and the desktop sidebar */}
          <input type="file" accept=".pdf,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

          {/* PHONE: compact upload bar (replaces the sidebar below md) */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-brand-primary text-white font-bold text-sm py-2.5 px-5 rounded-full shadow-md active:scale-95 transition-transform shrink-0 touch-target"
            >
              {latestFile ? "Change PDF" : "Upload PDF"}
            </button>
            <div className="flex-1 min-w-0 bg-[#F3F4F6] rounded-full px-4 py-2.5 border border-gray-100 text-sm">
              {latestFile ? (
                <span className="flex items-center justify-between gap-2">
                  <span className="text-black font-bold truncate">{latestFile.name}</span>
                  {uploadedFiles.length > 1 && <span className="text-gray-400 text-xs shrink-0">+{uploadedFiles.length - 1}</span>}
                </span>
              ) : (
                <span className="text-gray-500 font-medium truncate block">No form uploaded yet</span>
              )}
            </div>
          </div>

          {/* DESKTOP / TABLET: left sidebar */}
          <div className="hidden md:flex w-64 lg:w-80 flex-col gap-6 relative z-10 pt-4 shrink-0">
            <div className="bg-[#D9D9D9] rounded-[30px] p-6 lg:p-8 text-center shadow-sm">
              <p className="text-[11px] text-gray-500 italic mb-8 px-2 font-medium">
                (*Note : Upload Your Banking Applications, Loan & Financing Documents.)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-primary text-white font-bold text-lg py-3 px-8 rounded-full hover:bg-brand-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md w-[80%]"
              >
                Upload PDF
              </button>
            </div>

            <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 mt-4">
              <AnimatePresence initial={false}>
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#F3F4F6] rounded-full px-5 py-3.5 flex items-center justify-between gap-2 shadow-sm border border-gray-100"
                >
                  <span className="text-black font-bold text-sm truncate min-w-0">{file.name}</span>
                  <span className="text-gray-400 text-xs shrink-0">{file.date}</span>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>

          {/* CHAT WINDOW (min-h-0 lets the message list scroll instead of growing the page) */}
          <div className="flex-1 min-h-0 min-w-0 bg-[#F0F2F0] rounded-3xl md:rounded-[40px] relative p-3 sm:p-5 md:p-8 flex flex-col z-10">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-4 md:gap-6 mb-3 md:mb-6 pr-1 md:pr-4 pt-2 md:pt-6">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] md:max-w-[70%] px-4 md:px-6 py-3 md:py-4 rounded-[20px] text-[15px] whitespace-pre-wrap break-words font-semibold
                      ${msg.role === "user"
                        ? "bg-transparent border border-brand-primary text-brand-primary rounded-tr-sm"
                        : "bg-white text-black shadow-sm rounded-tl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-3">
                  <div className="flex items-center gap-1 bg-white rounded-full px-4 py-3 shadow-sm" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <div className="text-gray-400 text-sm italic py-2">Doctor Bank is Typing...</div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <UsageMeter
              chatId={chatId}
              refreshKey={usageTick}
              onUsage={handleUsage}
              className="mb-3 md:mb-4 max-md:p-3"
            />

            <div className="w-full relative mt-auto shrink-0">
              <input
                type="text"
                ref={messageInputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSendMessage()}
                enterKeyHint="send"
                autoComplete="off"
                aria-label="Message"
                placeholder={limitReached ? "Free plan limit reached" : "Type Your Message Here"}
                className="w-full bg-transparent border border-gray-300 rounded-full pl-5 md:pl-6 pr-14 md:pr-16 py-3.5 md:py-4 outline-none focus:border-brand-primary transition-colors text-gray-700 font-medium"
                disabled={isLoading || limitReached}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || limitReached || !inputText.trim()}
                aria-label="Send message"
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full w-11 h-11 md:w-10 md:h-10 flex items-center justify-center disabled:opacity-50 [@media(hover:hover)]:hover:scale-110 active:scale-90 transition-all duration-200"
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
    <Suspense fallback={<div className="min-h-dvh bg-white flex items-center justify-center">Loading...</div>}>
      <ChatMainLogic />
    </Suspense>
  );
}