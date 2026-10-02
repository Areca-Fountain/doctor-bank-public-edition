"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type Usage = {
  plan: "FREE" | "PRO";
  chatsUsed: number;
  chatsLimit: number;
  messagesUsed: number;
  messagesLimit: number;
  renewsAt: string | null;
};

type Props = {
  chatId?: string | null; // current chat; needed to count its messages
  refreshKey?: number; // change this number to reload the counter (e.g. after each message)
  showMessages?: boolean; // false = only show the chat allowance (used on the dashboard)
  onUsage?: (usage: Usage) => void;
  className?: string;
};

function Bar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const shown = Math.min(used, limit);
  const pct = Math.min(100, Math.round((shown / limit) * 100));
  const color = shown >= limit ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-primary";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
        <span>{label}</span>
        <span>
          {shown}/{limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UsageMeter({
  chatId = null,
  refreshKey = 0,
  showMessages = true,
  onUsage,
  className = "",
}: Props) {
  const [usage, setUsage] = useState<Usage | null>(null);

  // Keep the latest callback without re-running the fetch
  const onUsageRef = useRef(onUsage);
  useEffect(() => {
    onUsageRef.current = onUsage;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/usage${chatId ? `?id=${encodeURIComponent(chatId)}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data: Usage = await res.json();
        if (!cancelled) {
          setUsage(data);
          onUsageRef.current?.(data);
        }
      } catch (error) {
        console.error("Failed to load usage:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, refreshKey]);

  if (!usage) return null;

  if (usage.plan === "PRO") {
    return (
      <div className={`flex items-center gap-2 text-sm font-bold text-brand-primary ${className}`}>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Full House</span>
        <span className="text-gray-600 font-medium">Unlimited chats and messages</span>
      </div>
    );
  }

  const chatBlocked = !chatId && usage.chatsUsed >= usage.chatsLimit;
  const messagesBlocked = !!chatId && usage.messagesUsed >= usage.messagesLimit;
  const blocked = showMessages ? chatBlocked || messagesBlocked : usage.chatsUsed >= usage.chatsLimit;

  return (
    <div className={`rounded-2xl bg-white/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-black text-black">Free plan</span>
        {blocked && (
          <Link
            href="/#pricing"
            className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-brand-primary/90"
          >
            Upgrade
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Bar label="Chats" used={usage.chatsUsed} limit={usage.chatsLimit} />
        {showMessages && <Bar label="Messages in this chat" used={usage.messagesUsed} limit={usage.messagesLimit} />}
      </div>

      <p className="mt-3 text-xs font-medium text-gray-600">
        {!showMessages
          ? `Each chat allows up to ${usage.messagesLimit} messages.`
          : chatBlocked
          ? "You've used your free chat. Upgrade to start more."
          : messagesBlocked
          ? `You've used all ${usage.messagesLimit} free messages in this chat.`
          : `${usage.messagesLimit - usage.messagesUsed} messages left in this chat.`}
      </p>
    </div>
  );
}