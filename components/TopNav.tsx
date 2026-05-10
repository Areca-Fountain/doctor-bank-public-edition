"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function TopNav() {
  const { data: session } = useSession();

  return (
    // We use pointer-events-none on the container so users can click the chat behind the empty space, 
    // and pointer-events-auto on the actual buttons.
    <div className="fixed top-8 w-full z-50 px-8 flex justify-between items-center pointer-events-none">
      
      {/* LEFT SIDE: Home Pill & Theme Toggle */}
      <div className="flex items-center gap-4 pointer-events-auto">
        
        {/* Home Button Pill */}
        <Link 
          href="/" 
          className="bg-[#011F4B] text-white rounded-full flex items-center gap-4 pr-6 pl-1.5 py-1.5 shadow-lg hover:bg-[#011F4B]/90 transition-colors"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            {/* Make sure you have a logo.svg in your public folder! */}
            <Image src="/logo.svg" alt="Doctor Bank Logo" width={24} height={24} className="opacity-90" />
          </div>
          <span className="font-semibold text-lg tracking-wide">Home</span>
        </Link>

        {/* Toggle Switch */}
        <div className="bg-white rounded-full w-16 h-8 p-1 flex items-center shadow-md cursor-pointer border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="bg-[#011F4B] w-6 h-6 rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* RIGHT SIDE: Settings & Dashboard */}
      <div className="pointer-events-auto">
        {/* Main Dark Blue Pill Container */}
        <div className="bg-[#011F4B] p-1.5 pl-6 rounded-full flex items-center gap-6 shadow-lg">
          
          <Link href="/settings" className="text-white font-semibold text-lg hover:text-white/80 transition-colors">
            Go to Settings
          </Link>
          
          {/* Inner White Dashboard Pill */}
          <Link 
            href="/dashboard" 
            className="bg-white rounded-full flex items-center gap-3 pr-6 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200 ml-1.5">
              <img 
                // Uses your session image, or a fallback avatar matching the brown color in your UI mockup
                src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name || 'U'}&background=5C3A21&color=fff`} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[#011F4B] font-bold text-lg">Dashboard</span>
          </Link>
          
        </div>
      </div>

    </div>
  );
}