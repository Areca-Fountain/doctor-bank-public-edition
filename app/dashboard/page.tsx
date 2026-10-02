"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import TopNav from "@/components/TopNav"; // 1. Import TopNav

type SavedChat = {
  id: string;
  pdfName: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchChats();
    }
  }, [session]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      const res = await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchChats();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL saved chats? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/applications?all=true`, { method: "DELETE" });
      if (res.ok) fetchChats();
    } catch (error) {
      console.error("Failed to delete all:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-24 px-8">
      
      {/* 2. Replace hardcoded navbar with TopNav */}
      <TopNav view="dashboard" />

      {/* --- DASHBOARD MAIN CONTENT --- */}
      <div className="w-full max-w-[1300px] flex gap-8 h-[750px]">
        {/* Left Side: Welcome Banner / Info */}
        <div className="w-1/3 flex flex-col gap-6 pt-4">
          <div className="bg-[#D9D9D9] rounded-[40px] p-10 h-full flex flex-col shadow-sm relative overflow-hidden">
             <h1 className="text-4xl font-black text-[#011F4B] mb-4">
               {session?.user?.name ? `${session.user.name.split(' ')[0]}'s` : "Your"}<br/>
               Dashboard
             </h1>
             <p className="text-gray-600 font-medium text-lg leading-relaxed">
               Welcome back! Here you can view, manage, and continue all of your previous banking application sessions.
             </p>
          </div>
        </div>

        {/* Right Side: Scrollable Saved Chats */}
        <div className="w-2/3 bg-[#F0F2F0] rounded-[40px] p-8 flex flex-col shadow-inner relative">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold text-[#011F4B]">Saved Chats</h2>
            <button 
              onClick={handleDeleteAll}
              disabled={chats.length === 0}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full transition-colors shadow-sm"
            >
              Delete All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 flex flex-col gap-4">
            {isLoading ? (
              <p className="text-gray-500 text-center mt-10 font-medium">Loading your chats...</p>
            ) : chats.length === 0 ? (
              <p className="text-gray-500 text-center mt-10 font-medium">No saved chats found. Start a new interview to see it here!</p>
            ) : (
              chats.map((chat) => (
                <div key={chat.id} className="bg-white rounded-[25px] p-5 flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="bg-[#D9D9D9] px-6 py-3 rounded-full flex items-center">
                     <span className="text-[#011F4B] font-bold truncate max-w-[200px]">{chat.pdfName}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-400 font-medium mr-2">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </p>
                    <Link 
                      href={`/chat?id=${chat.id}`} 
                      className="bg-[#011F4B] hover:bg-[#011F4B]/90 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
                    >
                      Continue
                    </Link>
                    <button 
                      onClick={() => handleDelete(chat.id)}
                      className="bg-[#FF0000] hover:bg-red-700 w-12 h-12 flex items-center justify-center rounded-full transition-colors shadow-sm text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}