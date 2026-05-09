"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import TopNav from "../../../components/TopNav";
import { Message } from "../../../types";

export default function ChatApp() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "dashboard">("chat");

  // View 1: Upload Document
  if (!pdfData) {
    return (
      <div className="relative flex flex-col min-h-screen bg-background">
        <TopNav view={view} setView={setView} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full glass rounded-3xl p-8 text-center shadow-2xl border-white/20">
            <div className="w-20 h-20 bg-brand-secondary/20 text-brand-secondary rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📄</div>
            <h1 className="text-3xl font-bold mb-2">Doctor Bank</h1>
            <p className="opacity-70 mb-8">Upload your application form to begin your AI-guided interview.</p>
            <button 
              onClick={() => document.getElementById('file-upload')?.click()} 
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-95"
            >
              Upload PDF Form
            </button>
            <input type="file" id="file-upload" accept="application/pdf" className="hidden" />
          </div>
        </div>
      </div>
    );
  }

  // View 2: The Chat Interface
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <TopNav view={view} setView={setView} />
      
      <div className="glass border-b px-6 py-4 pt-24 flex items-center justify-between z-10">
        <div>
          <h1 className="font-bold text-xl">Doctor Bank</h1>
          <p className="text-xs text-brand-secondary font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Analyzing Document
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
            msg.role === "user" ? "bg-brand-primary text-white self-end ml-auto" : "glass self-start"
          }`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 w-full p-6 glass border-t flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-4 rounded-2xl focus:outline-none ring-1 ring-black/10 dark:ring-white/20 bg-background/50"
        />
        <button className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-bold hover:brightness-110 transition">
          Send
        </button>
      </div>
    </div>
  );
}