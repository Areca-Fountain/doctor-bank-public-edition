"use client";

import { signOut, useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image"; // Added Image import

interface TopNavProps {
  view?: "chat" | "dashboard";
  setView?: (view: "chat" | "dashboard") => void;
}

export default function TopNav({ view, setView }: TopNavProps) {
  const { data: session } = useSession();

  return (
    <div className="fixed top-8 w-full z-40 flex justify-center px-4">
      <nav className="bg-brand-primary rounded-full px-2 py-2 flex items-center justify-between w-full max-w-[800px] shadow-2xl">
        
        {/* Left Side: Logo & Main Links */}
        <div className="flex items-center gap-10 pl-2">
          {/* --- UPDATED LOGO SECTION --- */}
          <Link 
            href="/" 
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
          >
            <Image 
              src="/logo.svg" 
              alt="Doctor Bank Logo" 
              width={32} // Display size in pixels
              height={32}
              priority // Tells Next.js to load this immediately
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </Link>

          {/* Marketing Links */}
          {!session ? (
            <div className="hidden md:flex items-center gap-8 text-white/90 text-sm font-medium">
              <Link href="/#home" className="hover:text-white transition-colors">Home</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/#about" className="hover:text-white transition-colors">About Us</Link>
            </div>
          ) : (
            /* App Navigation */
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
              className="w-12 h-12 rounded-full border border-white/20 overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img 
                src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=fff&color=011F4B`} 
                alt="User" 
                className="w-full h-full object-cover"
              />
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