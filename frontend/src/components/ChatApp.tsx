"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, Settings, Palette, Pipette, ChevronRight } from "lucide-react";
import { predictWithBrain } from "@/lib/mlBrain";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Left Sidebar                                                       */
/* ------------------------------------------------------------------ */

function Sidebar() {
  return (
    <div className="flex w-[170px] shrink-0 flex-col justify-between py-6 pl-6 pr-3">
      {/* top nav card */}
      <div className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/[0.08]">
        {/* header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white/90">Home</span>
          <Search size={13} className="text-white/40" />
        </div>

        {/* links */}
        <div className="space-y-1">
          <SidebarItem label="Home" icon="🏠" />
          <SidebarItem label="Profile" icon="👤" />
          <SidebarItem label="Emergency Resources" highlight />
        </div>

        {/* dark‑mode toggle */}
        <div className="mt-3 flex items-center justify-between rounded-lg px-2 py-1">
          <span className="text-[10px] text-white/50">Dark</span>
          <div className="h-[16px] w-[28px] rounded-full bg-emerald-500/70 p-[2px]">
            <div className="ml-auto h-[12px] w-[12px] rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>

      {/* bottom settings card */}
      <div className="mt-3 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/[0.08]">
        <div className="space-y-1">
          <SidebarItem label="Customize Theme" icon={<Palette size={11} />} />
          <SidebarItem label="Colors" icon={<Pipette size={11} />} />
          <SidebarItem label="Settings" icon={<Settings size={11} />} />
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  label,
  icon,
  highlight,
}: {
  label: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
        highlight
          ? "bg-amber-400/20 font-semibold text-amber-200 ring-1 ring-amber-300/30"
          : "text-white/55 hover:bg-white/[0.04]"
      }`}
    >
      {icon && <span className="text-[10px]">{icon}</span>}
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right Knowledge Base panel                                         */
/* ------------------------------------------------------------------ */

function KnowledgeBasePanel({ hits }: { hits: string[] }) {
  const defaults = [
    { title: "Coping with Anxiety", sub: "tips, tricks, lifestyle" },
    { title: "Mindfulness Concepts", sub: "meditation, focus" },
    { title: "Mindfulness Courses", sub: "step-by-step guide" },
  ];

  const items = hits.length
    ? hits.slice(0, 4).map((t) => ({ title: t, sub: "" }))
    : defaults;

  return (
    <div className="flex w-[185px] shrink-0 flex-col py-6 pl-3 pr-6">
      <div className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/[0.08]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-white/90">Knowledge Base</span>
          <ChevronRight size={13} className="text-white/40" />
        </div>

        {/* browse pill */}
        <button
          type="button"
          className="mb-3 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] text-white/55 ring-1 ring-white/[0.08]"
        >
          Browse
        </button>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-lg bg-white/[0.05] px-3 py-2 ring-1 ring-white/[0.06]"
            >
              <div className="text-[11px] font-medium text-white/75">{item.title}</div>
              {item.sub && (
                <div className="mt-0.5 text-[9px] text-white/30">{item.sub}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat bubble                                                        */
/* ------------------------------------------------------------------ */

function ChatBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2 text-[12px] leading-relaxed ${
            isUser
              ? "rounded-br-md bg-emerald-400/60 text-white"
              : "rounded-bl-md bg-blue-500/70 text-white"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className="mt-0.5 text-[9px] text-white/25">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ChatApp() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supportEmail = (
    process.env.NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL || "support@example.com"
  ).trim();

  const historyForBrain = useMemo(
    () =>
      messages.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.text })),
    [messages]
  );

  /* auto‑scroll */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  /* latest KB hits for the right panel */
  const latestKbHits = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && Array.isArray(m.kb_hits) && m.kb_hits.length)
        return m.kb_hits;
    }
    return [] as string[];
  }, [messages]);

  /* ---- send ---- */
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get response");
    } finally {
      setSending(false);
    }
  }

  function openMailTo() {
    const subject = encodeURIComponent("MHChat: connect to a human");
    const body = encodeURIComponent(
      "Hi, I'd like to connect to a human for support.\n\n(You can optionally paste relevant context here.)"
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  /* ---- render ---- */
  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-slate-200/80 p-6">
      {/* outer rounded card */}
      <div
        className="flex w-full max-w-[1100px] overflow-hidden rounded-[36px] bg-[#1a1a20] shadow-2xl ring-1 ring-white/[0.06]"
        style={{ height: "min(680px, calc(100dvh - 48px))" }}
      >
        {/* ===== LEFT SIDEBAR ===== */}
        <Sidebar />

        {/* ===== CENTER CHAT ===== */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* header */}
          <div className="px-8 pt-7 pb-2 text-center">
            <div className="text-2xl font-semibold tracking-tight text-white">mhchat</div>
          </div>

          {/* messages area */}
          <div className="relative flex-1 px-8">
            {error && (
              <div className="absolute inset-x-0 top-1 z-10 flex justify-center">
                <div className="rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/70">
                  {error}
                </div>
              </div>
            )}

            <div
              ref={scrollRef}
              className="h-full overflow-y-auto pb-3 pt-3"
              style={{ scrollbarGutter: "stable" }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-white/30">
                  Type a message to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <ChatBubble key={m.id} message={m} />
                  ))}
                  {sending && (
                    <div className="text-center text-[11px] text-white/35">
                      Assistant is typing…
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* dots indicator */}
          <div className="flex justify-center gap-1.5 py-1.5">
            <span className="h-[4px] w-[4px] rounded-full bg-white/25" />
            <span className="h-[4px] w-[4px] rounded-full bg-white/25" />
            <span className="h-[4px] w-[4px] rounded-full bg-white/25" />
            <span className="h-[4px] w-[4px] rounded-full bg-white/25" />
          </div>

          {/* input bar */}
          <div className="px-8 pb-6">
            <div className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 ring-1 ring-white/[0.08]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending}
                placeholder="Type your message..."
                className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder:text-white/25 outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:text-white disabled:opacity-30"
                title="Send"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ===== RIGHT KNOWLEDGE BASE ===== */}
        <KnowledgeBasePanel hits={latestKbHits} />
      </div>

      {/* ===== Crisis modal ===== */}
      {showCrisis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a20] p-6 text-white shadow-2xl">
            <div className="text-lg font-semibold">Immediate support</div>
            <div className="mt-2 text-sm text-white/55">
              If you feel like you might harm yourself or someone else, please call
              your local emergency number right now. If you can, reach out to a
              trusted person and don&apos;t stay alone.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={openMailTo}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                type="button"
              >
                Connect to human
              </button>
              <button
                onClick={() => setShowCrisis(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/65 hover:bg-white/5"
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
