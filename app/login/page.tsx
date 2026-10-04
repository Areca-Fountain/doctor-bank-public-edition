"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import TopNav from "@/components/TopNav";

// Minimal typings for the parts of Google Identity Services we use
type GsiCredentialResponse = { credential?: string };
type GsiId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GsiCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GsiId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(
    CLIENT_ID ? null : "Google sign-in isn't configured yet (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID)."
  );

  const handleCredential = useCallback(
    async (response: GsiCredentialResponse) => {
      if (!response.credential) {
        setError("Google didn't return a sign-in token. Please try again.");
        return;
      }
      setError(null);
      const result = await signIn("google-identity", {
        credential: response.credential,
        redirect: false,
      });
      if (result?.ok) {
        router.push("/chat");
        router.refresh();
      } else {
        setError("We couldn't sign you in. Your account may be suspended, or the sign-in expired. Please try again.");
      }
    },
    [router]
  );

  // The script can already be loaded when coming back to this page
  useEffect(() => {
    if (window.google?.accounts?.id) setScriptReady(true);
  }, []);

  // Let Google draw its own official button. We never recreate Google's logo or styling.
  useEffect(() => {
    if (!scriptReady || !CLIENT_ID || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
      ux_mode: "popup",
      use_fedcm_for_button: true,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      width: 280,
    });
  }, [scriptReady, handleCredential]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <TopNav />

      <div className="min-h-dvh bg-white flex items-center justify-center px-4 pt-24 pb-6">
        <div className="bg-[#D9D9D9] w-full max-w-md rounded-3xl md:rounded-[40px] p-6 sm:p-12 flex flex-col items-center shadow-sm">
          <div className="bg-brand-primary w-36 h-36 sm:w-48 sm:h-48 rounded-full flex items-center justify-center mb-8 sm:mb-12 shadow-inner p-6 relative overflow-hidden">
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <img src="/logo.svg" alt="Doctor Bank Logo" className="w-50 h-50" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to Doctor Bank</h1>
          <p className="text-sm text-gray-700 text-center mb-6">
            New here? Signing in creates your account automatically.
          </p>

          {/* Official Google Identity Services button is rendered into this element */}
          <div ref={buttonRef} className="min-h-[44px] flex justify-center" />

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700 text-center">
              {error}
            </p>
          )}

          <p className="mt-6 text-xs text-gray-700 text-center leading-relaxed">
            Sign-in happens in a window from Google. Doctor Bank never sees your Google password.
            <br />
            Doctor Bank is an independent AI form-filling assistant. It is not a bank and is not
            affiliated with any bank or with Google.
          </p>
        </div>
      </div>
    </>
  );
}