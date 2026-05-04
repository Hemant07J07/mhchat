"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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

function ChatBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-flex items-start gap-2 rounded-2xl border border-white/10 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser ? "rounded-br-md" : "rounded-bl-md"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          {formatTime(message.createdAt)}
        </div>
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const supportEmail =
    (process.env.NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL || "support@example.com").trim();

  const historyForBrain = useMemo(() => {
    return messages
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.text }));
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
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
      "Hi, I'd like to connect to a human for support.\n\n(You can optionally paste relevant context here.)"
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="min-h-dvh w-full px-4 py-6 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-5xl flex-col rounded-[28px] border border-white/10 bg-black/80 shadow-[0_40px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur"
        style={{ minHeight: "min(880px, calc(100dvh - 48px))" }}
      >
        <section className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <div className="text-sm font-semibold text-white">MHChatbox</div>
              <div className="text-xs text-white/50">Simple, focused conversation space</div>
            </div>
            <button
              type="button"
              onClick={openMailTo}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm transition hover:bg-white/10"
            >
              Connect to a human
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
            style={{ maxHeight: "min(760px, calc(100dvh - 220px))" }}
          >
            {messages.length === 0 && !sending ? (
              <div className="max-w-xl rounded-2xl border border-white/10 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
                Hello, I'm here to support you. How are you feeling today?
              </div>
            ) : (
              messages.map((message) => <ChatBubble key={message.id} message={message} />)
            )}

            {sending ? (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
                Generating response...
              </div>
            ) : null}

            {showCrisis ? (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                We detected crisis indicators. Please reach out to a human supporter right away.
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 px-6 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
                <span className="rounded-full border border-white/15 px-2 py-1">+ Quick tools</span>
                <span className="font-mono">Support: {supportEmail}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-2 shadow-sm">
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
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-full border border-white/20 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm"
                    title="Attach"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                  <ArrowRight size={16} />
                </button>
              </div>
              {error ? <div className="text-xs text-rose-300">{error}</div> : null}
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
