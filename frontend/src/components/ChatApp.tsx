"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Folder, Smile, Users } from "lucide-react";
import { predictWithBrain } from "@/lib/mlBrain";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  kb_hits?: string[];
  crisis?: boolean;
  intent?: string;
  intent_score?: number;
};

const MAX_HISTORY = 10;

type PhoneVariant = "dark" | "light";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function PhoneHeader({ variant }: { variant: PhoneVariant }) {
  const dots = variant === "dark" ? "bg-slate-400/70" : "bg-slate-300";
  const title = variant === "dark" ? "text-white" : "text-slate-900";
  const subtitle = variant === "dark" ? "text-slate-300" : "text-slate-400";

  return (
    <div className="relative px-8 pt-10 pb-4">
      <div className={`text-center text-3xl font-semibold tracking-tight ${title}`}>mhchat</div>
      <div className={`mt-5 text-center text-[10px] font-semibold tracking-[0.35em] ${subtitle}`}>
        GHAT YE2
      </div>
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dots}`} />
        <div className={`h-2 w-2 rounded-full ${dots}`} />
        <div className={`h-2 w-2 rounded-full ${dots}`} />
      </div>
    </div>
  );
}

function ChatBubble({
  variant,
  message,
}: {
  variant: PhoneVariant;
  message: UiMessage;
}) {
  const isUser = message.role === "user";

  const avatarBg = variant === "dark" ? "bg-white/20" : "bg-slate-200";
  const avatarText = variant === "dark" ? "text-white/80" : "text-slate-600";

  const botBubble = "bg-blue-500 text-white shadow-lg shadow-blue-500/20";
  const userBubble = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";

  const timeText = variant === "dark" ? "text-slate-400" : "text-slate-400";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className={`h-9 w-9 rounded-full ${avatarBg} flex items-center justify-center ${avatarText} text-xs font-semibold`}>
          
        </div>
      )}

      <div className={`max-w-[78%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? userBubble : botBubble
          } ${isUser ? "rounded-br-md" : "rounded-bl-md"}`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className={`mt-2 text-[11px] ${timeText}`}>{formatTime(message.createdAt)}</div>
      </div>

      {isUser && (
        <div className={`h-9 w-9 rounded-full ${avatarBg} flex items-center justify-center ${avatarText} text-xs font-semibold`}>
          
        </div>
      )}
    </div>
  );
}

function PhoneShell({
  variant,
  children,
}: {
  variant: PhoneVariant;
  children: React.ReactNode;
}) {
  const shell =
    variant === "dark"
      ? "bg-gradient-to-b from-slate-950 to-slate-900"
      : "bg-white";

  return (
    <div className="w-full max-w-[420px]">
      <div className={`mx-auto w-full rounded-[34px] ${shell} shadow-2xl ring-1 ring-black/5`}>
        {children}
      </div>
    </div>
  );
}

function BottomBar({
  variant,
  input,
  setInput,
  sending,
  onSend,
  onConnectHuman,
}: {
  variant: PhoneVariant;
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  onSend: () => void;
  onConnectHuman: () => void;
}) {
  const iconWrap =
    variant === "dark"
      ? "text-white/80 hover:text-white"
      : "text-slate-500 hover:text-slate-900";

  const inputBg = variant === "dark" ? "bg-white/5" : "bg-slate-50";
  const inputBorder = variant === "dark" ? "border-white/10" : "border-slate-200";
  const inputText = variant === "dark" ? "text-white" : "text-slate-900";
  const inputPlaceholder = variant === "dark" ? "placeholder:text-white/40" : "placeholder:text-slate-400";

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onConnectHuman}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${iconWrap}`}
            title="Connect to human"
          >
            <Users size={18} />
          </button>
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${iconWrap}`}
            title="Files"
            disabled
          >
            <Folder size={18} />
          </button>
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${iconWrap}`}
            title="Emoji"
            disabled
          >
            <Smile size={18} />
          </button>
        </div>

        <div className={`flex flex-1 items-center gap-3 rounded-full border ${inputBorder} ${inputBg} px-4 py-2`}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={sending}
            placeholder="Type your message..."
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${inputText} ${inputPlaceholder}`}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !input.trim()}
            className={`${
              variant === "dark" ? "text-white/60 hover:text-white" : "text-slate-400 hover:text-slate-900"
            } disabled:opacity-40`}
            title="Send"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={sending || !input.trim()}
          className="h-10 rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default function ChatApp() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const scrollRefDark = useRef<HTMLDivElement>(null);
  const scrollRefLight = useRef<HTMLDivElement>(null);

  const supportEmail =
    (process.env.NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL || "support@example.com").trim();

  const historyForBrain = useMemo(() => {
    return messages
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.text }));
  }, [messages]);

  useEffect(() => {
    const refs = [scrollRefDark.current, scrollRefLight.current].filter(Boolean) as HTMLDivElement[];
    for (const el of refs) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    const userMsg: UiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await predictWithBrain({
        message: text,
        history: historyForBrain,
      });

      console.log(
        `[brain] request_id=${result.request_id} intent=${result.intent} score=${result.intent_score} crisis=${result.crisis}`
      );

      const botMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: result.reply,
        createdAt: new Date().toISOString(),
        kb_hits: Array.isArray(result.kb_hits) ? result.kb_hits : [],
        crisis: !!result.crisis,
        intent: result.intent,
        intent_score: result.intent_score,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (result.crisis) setShowCrisis(true);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "Failed to get response");
    } finally {
      setSending(false);
    }
  }

  function openMailTo() {
    const subject = encodeURIComponent("MHChat: connect to a human");
    const body = encodeURIComponent(
      "Hi, I’d like to connect to a human for support.\n\n(You can optionally paste relevant context here.)"
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-slate-100 to-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 lg:flex-row lg:items-stretch lg:gap-14">
        {(["dark", "light"] as const).map((variant) => {
          const scrollRef = variant === "dark" ? scrollRefDark : scrollRefLight;
          const messageAreaBg = variant === "dark" ? "bg-transparent" : "bg-transparent";
          const errorPillBg = variant === "dark" ? "bg-white/10 text-white/80" : "bg-slate-100 text-slate-500";
          const hintText = variant === "dark" ? "text-white/50" : "text-slate-400";

          return (
            <PhoneShell key={variant} variant={variant}>
              <div className="flex min-h-[740px] flex-col">
                <PhoneHeader variant={variant} />

                <div className={`relative flex-1 px-6 ${messageAreaBg}`}>
                  {error && (
                    <div className="absolute left-0 right-0 top-2 flex justify-center">
                      <div className={`rounded-md px-3 py-1 text-xs ${errorPillBg}`}>{error}</div>
                    </div>
                  )}

                  <div
                    ref={scrollRef}
                    className="h-full overflow-auto pb-6 pt-8"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {messages.length === 0 ? (
                      <div className={`px-2 pt-14 text-center text-sm ${hintText}`}>
                        Type a message to start.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((m) => (
                          <ChatBubble key={`${variant}-${m.id}`} variant={variant} message={m} />
                        ))}

                        {sending && (
                          <div className={`text-center text-xs ${hintText}`}>Assistant is typing…</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <BottomBar
                  variant={variant}
                  input={input}
                  setInput={setInput}
                  sending={sending}
                  onSend={() => void handleSend()}
                  onConnectHuman={openMailTo}
                />
              </div>
            </PhoneShell>
          );
        })}
      </div>

      {showCrisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background w-full max-w-lg rounded-lg border border-border p-5">
            <div className="text-lg font-semibold">Immediate support</div>
            <div className="text-muted-foreground mt-2 text-sm">
              If you feel like you might harm yourself or someone else, please call your local emergency number
              right now. If you can, reach out to a trusted person and don’t stay alone.
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={openMailTo}
                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-semibold"
                type="button"
              >
                Connect to human
              </button>
              <button
                onClick={() => setShowCrisis(false)}
                className="rounded-md border border-input px-3 py-2 text-sm"
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
