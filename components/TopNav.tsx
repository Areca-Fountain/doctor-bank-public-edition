"use client";

import { signOut, useSession, signIn } from "next-auth/react";
import Link from "next/link";

// 1. Define the props TypeScript should expect
interface TopNavProps {
  view?: "chat" | "dashboard";
  setView?: (view: "chat" | "dashboard") => void;
}

// 2. Pass the props into the component
export default function TopNav({ view, setView }: TopNavProps) {
  const { data: session } = useSession();

  return (
    <div className="fixed top-8 w-full z-40 flex justify-center px-4">
      <nav className="bg-brand-primary rounded-full px-2 py-2 flex items-center justify-between w-full max-w-[800px] shadow-2xl">
        
        {/* Left Side: Logo & Main Links */}
        <div className="flex items-center gap-10 pl-2">
          {/* Logo */}
          <Link href="/" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5 14.5C19.5 14.5 21 14.5 21 12.5C21 10.5 19.5 10.5 19.5 10.5V9C19.5 7.5 18 6 15 6C15 6 14.5 4.5 13 4.5H11C9.5 4.5 9 6 9 6C6 6 4.5 7.5 4.5 9V14.5C4.5 14.5 3 14.5 3 16.5C3 18.5 4.5 18.5 4.5 18.5V20H7.5V18.5H16.5V20H19.5V18.5C19.5 18.5 21 18.5 21 16.5C21 14.5 19.5 14.5 19.5 14.5ZM7.5 10.5C6.67 10.5 6 9.83 6 9C6 8.17 6.67 7.5 7.5 7.5C8.33 7.5 9 8.17 9 9C9 9.83 8.33 10.5 7.5 10.5Z"/>
            </svg>
          </Link>

          {/* Conditional Nav Links: Shows Marketing Links OR App Links depending on session */}
          {!session ? (
            <div className="hidden md:flex items-center gap-8 text-white/90 text-sm font-medium">
              <Link href="/#home" className="hover:text-white transition-colors">Home</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/#about" className="hover:text-white transition-colors">About Us</Link>
            </div>
          ) : (
            // App Navigation (Chat / Dashboard Toggle)
            <div className="hidden md:flex items-center gap-8 text-white/90 text-sm font-medium">
              {setView && (
                <>
                  <button 
                    onClick={() => setView("chat")} 
                    className={`transition-all ${view === "chat" ? "text-white underline underline-offset-8 decoration-2 decoration-white/50" : "text-white/60 hover:text-white"}`}
                  >
                    Chat
                  </button>
                  <button 
                    onClick={() => setView("dashboard")} 
                    className={`transition-all ${view === "dashboard" ? "text-white underline underline-offset-8 decoration-2 decoration-white/50" : "text-white/60 hover:text-white"}`}
                  >
                    Dashboard
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Auth */}
        <div className="flex items-center gap-4 pr-2 text-sm font-semibold">
          {session?.user ? (
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-10 h-10 rounded-full border border-white/20 overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=fff&color=011F4B`} alt="User" />
            </button>
          ) : (
            <>
              <button onClick={() => signIn("google")} className="text-white hover:text-white/80 transition-colors px-4">Login</button>
              <button onClick={() => signIn("google")} className="bg-white text-brand-primary px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm">
                Sign up
              </button>
            </>
          )}
        </div>

      </nav>
    </div>
  );
}