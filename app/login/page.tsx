"use client";

import { signIn } from "next-auth/react";
import TopNav from "@/components/TopNav";
import Image from "next/image";

export default function LoginPage() {
  return (
    <>
      {/* Assuming you want your top navigation here as shown in the mockup */}
      <TopNav />
      
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        
        {/* The Gray Login Card */}
        <div className="bg-[#D9D9D9] w-full max-w-md rounded-[40px] p-12 flex flex-col items-center shadow-sm">
          
          {/* Blue Circle with Piggy Bank */}
          <div className="bg-brand-primary w-48 h-48 rounded-full flex items-center justify-center mb-12 shadow-inner p-6 relative overflow-hidden">
             {/* Replace with your actual white piggy bank logo if you have an SVG */}
             <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
<img 
  src="/logo.svg" 
  alt="Doctor Bank Logo" 
  className="w-50 h-50 group-hover:scale-110 transition-transform duration-200"
/>
             </div>
          </div>

          {/* Sign In With Google Button */}
          <button 
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full py-3 px-2 flex items-center gap-4 transition-colors shadow-md group"
          >
            {/* White circle with Google 'G' */}
            <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
            </div>
            <span className="font-semibold text-lg mx-auto pr-10">Sign in With Google</span>
          </button>

          {/* Sign Up Link */}
          <div className="mt-6">
            <button 
              onClick={() => signIn("google", { callbackUrl: "/chat" })}
              className="text-brand-primary font-bold text-[17px] underline underline-offset-4 hover:text-brand-primary/80 transition-colors"
            >
              or Sign Up Now
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
