"use client";

import { signOut, useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface TopNavProps {
  view?: "chat" | "dashboard";
  setView?: (view: "chat" | "dashboard") => void;
}

export default function TopNav({ view, setView }: TopNavProps) {
  const { data: session } = useSession();

  return (
    <div className="fixed top-8 w-full z-50 flex justify-center px-4 pointer-events-none">
      
      {/* Main Dark Blue Nav Bar */}
      <nav className="bg-[#011F4B] rounded-[40px] px-2 py-2 flex items-center justify-between w-full max-w-[1100px] shadow-2xl pointer-events-auto">
        
        {/* Left Side: Logo & Links */}
        <div className="flex items-center gap-10 pl-2">
          
          {/* Logo */}
          <Link 
            href="/" 
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
          >
            <Image 
              src="/logo.svg" 
              alt="Doctor Bank Logo" 
              width={36} 
              height={36}
              priority 
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </Link>

          {/* Navigation Links - Visible based on your new UI */}
          <div className="hidden md:flex items-center gap-8 text-white text-[17px] font-medium tracking-wide">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <Link href="/#pricing" className="hover:text-white/80 transition-colors">Pricing</Link>
            <Link href="/#about" className="hover:text-white/80 transition-colors">About Us</Link>
          </div>
        </div>

        {/* Right Side: Auth / Profile */}
        <div className="flex items-center gap-6 pr-2">
          {session?.user ? (
            <>
              {/* Red Log Out Button */}
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-[#FF0000] hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-full transition-colors shadow-sm"
              >
                Log Out
              </button>

              {/* White User Profile Pill - NOW A CLICKABLE LINK TO DASHBOARD */}
              <Link 
                href="/dashboard"
                className="bg-white rounded-full flex items-center gap-3 pr-6 py-1.5 shadow-md hover:bg-gray-100 hover:scale-[1.02] transition-all cursor-pointer"
                title="Go to Dashboard"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 ml-1.5 bg-[#0188CB] flex items-center justify-center text-white font-bold text-xl">
                  {/* If they have a Google image, use it. Otherwise show their initial */}
                  {session.user.image ? (
                     <img 
                      src={session.user.image} 
                      alt="User Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    session.user.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-[#011F4B] font-bold text-lg">
                  {session.user.name?.split(' ')[0] || 'Username'}
                </span>
              </Link>
            </>
          ) : (
            /* Logged Out State */
            <>
              <button onClick={() => signIn("google")} className="text-white hover:text-white/80 transition-colors px-4 font-semibold text-lg">
                Login
              </button>
              <button onClick={() => signIn("google")} className="bg-white text-[#011F4B] font-bold text-lg px-8 py-2.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>
      
    </div>
  );
}