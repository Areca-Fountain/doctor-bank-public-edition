"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import TopNav from "../components/TopNav";

interface Message {
  role: string;
  text: string;
  pdfData?: string | null; 
}

export default function Home() {
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  
  const [view, setView] = useState<"chat" | "dashboard">("chat");
  const [savedApps, setSavedApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // 📍 NEW: States for our UX polish features
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && inputRef.current && view === "chat") {
      inputRef.current.focus();
    }
  }, [isLoading, view]);

  useEffect(() => {
    if (view === "dashboard" && session?.user?.email) {
      setIsDashboardLoading(true); // 📍 Start loading animation
      fetch("/api/applications")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSavedApps(data);
      })
      .catch(err => console.error("Failed to load apps", err))
      .finally(() => setIsDashboardLoading(false)); // 📍 Stop loading animation
    }
  }, [view, session]);

  // 📍 NEW: Helper function to show and hide the toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // Hides after 3 seconds
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      // 📍 NEW: Replaced alert() with our custom toast
      showToast("Please upload a valid PDF file.");
      return;
    }

    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(",")[1];
      setPdfData(base64String);
      setMessages([{ role: "ai", text: `I have scanned "${file.name}". Select What you need \n        1. Would you like to ask specific questions about it, or \n        2. start an interview to fill it out?` }]);
      setView("chat"); 
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!input.trim() || !pdfData) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: input, history: messages, pdfData: pdfData }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev, 
        { 
          role: "ai", 
          text: data.text, 
          pdfData: data.pdfBase64 
        }
      ]);

    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 📍 NEW: Reusable Toast Component block
  const ToastNotification = () => toastMessage ? (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold z-50 flex items-center gap-2 animate-bounce transition-all">
      ⚠️ {toastMessage}
    </div>
  ) : null;

  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50 p-8 pt-24 relative">
        <TopNav view={view} setView={setView} />
        <ToastNotification />
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">My Saved Applications</h1>
          
          {/* 📍 NEW: Conditional rendering for the Loading Skeleton */}
          {isDashboardLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((skeleton) => (
                <div key={skeleton} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : savedApps.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
              <p className="text-gray-500 text-lg">You haven't completed any applications yet.</p>
              <button 
                onClick={() => setView("chat")} 
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Start a new one
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {savedApps.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{app.pdfName}</h3>
                      <p className="text-sm text-gray-500">Completed on {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition"
                    >
                      {selectedAppId === app.id ? "Hide Data" : "View JSON Data"}
                    </button>
                  </div>
                  
                  {selectedAppId === app.id && (
                    <div className="mt-6 bg-gray-900 text-green-400 p-6 rounded-xl overflow-x-auto text-sm font-mono shadow-inner">
                      <pre>{JSON.stringify(app.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <TopNav view={view} setView={setView} />
        <ToastNotification />

        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border mt-10">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">📄</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Bank</h1>
          <p className="text-gray-500 mb-8">Upload any blank bank application form to start.</p>
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-md">
            Upload PDF Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 relative">
      <TopNav view={view} setView={setView} />
      <ToastNotification />

      <div className="bg-white border-b px-6 py-4 pt-20 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="font-bold text-gray-800 text-xl">Doctor Bank</h1>
          <p className="text-xs text-green-600 font-medium">● Analyzing: {pdfName}</p>
        </div>
        <button onClick={() => setPdfData(null)} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition font-medium">
          Close Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col pb-32">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white self-end rounded-br-none ml-auto"
                : "bg-white text-gray-800 border self-start rounded-bl-none"
            }`}
          >
            <span className="whitespace-pre-wrap">{msg.text}</span>

            {msg.pdfData && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:application/pdf;base64,${msg.pdfData}`;
                    link.download = `Filled_${pdfName}`;
                    link.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold transition ease-in-out"
                >
                  📥 Download Filled PDF
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-white border text-gray-500 self-start p-4 rounded-2xl rounded-bl-none shadow-sm animate-pulse">
            Doctor Bank is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 w-full p-4 bg-white border-t flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message here..."
          className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-black bg-gray-50"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}