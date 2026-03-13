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
      <div className="max-w-[72%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-slate-900 text-white rounded-bl-md"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </div>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
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

  const latestKbHits = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === "assistant" && Array.isArray(m.kb_hits) && m.kb_hits.length) {
        return m.kb_hits;
      }
    }
    return [] as string[];
  }, [messages]);

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
    <div className="min-h-dvh w-full">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-10 sm:px-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
              MH
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">MHChat</div>
              <div className="text-xs text-slate-500">Mental health support chat</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-mono">Support: {supportEmail}</span>
            <button
              type="button"
              onClick={openMailTo}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Connect to a human
            </button>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/85 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Conversation
                </div>
                <div className="text-sm font-semibold text-slate-900">MHChatbox</div>
              </div>
              <div className="text-xs text-slate-500">Messages: {messages.length}</div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
              style={{ maxHeight: "min(720px, calc(100dvh - 240px))" }}
            >
              {messages.length === 0 && !sending ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500">
                  Start a conversation. Your responses stay on this page and are not shared.
                </div>
              ) : (
                messages.map((message) => <ChatBubble key={message.id} message={message} />)
              )}

              {sending ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                  Generating response...
                </div>
              ) : null}
            </div>

            <div className="border-t border-slate-200/70 px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                  placeholder="Share what is on your mind..."
                  rows={2}
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Send
                  <ArrowRight size={16} />
                </button>
              </div>
              {error ? <div className="mt-2 text-xs text-rose-500">{error}</div> : null}
            </div>
          </section>

          <motion.aside
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
            }}
            className="space-y-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <SideCard title="Session">
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Recent intent</span>
                    <span className="font-mono text-slate-900">
                      {messages[messages.length - 1]?.intent ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence</span>
                    <span className="font-mono text-slate-900">
                      {messages[messages.length - 1]?.intent_score?.toFixed(2) ?? "-"}
                    </span>
                  </div>
                </div>
              </SideCard>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <SideCard title="Knowledge base">
                <ul className="space-y-2 text-xs text-slate-600">
                  {(latestKbHits.length
                    ? latestKbHits
                    : [
                        "Coping with anxiety",
                        "Mindfulness basics",
                        "Breathing exercises",
                        "Grounding techniques",
                      ]
                  )
                    .slice(0, 4)
                    .map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="rounded-lg border border-slate-100 bg-white px-3 py-2"
                      >
                        {item}
                      </li>
                    ))}
                </ul>
              </SideCard>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
              <SideCard title="Safety">
                <div className="text-xs text-slate-600">
                  {showCrisis
                    ? "We detected crisis indicators. Please reach out to a human supporter right away."
                    : "If you feel unsafe or overwhelmed, contact your local emergency resources."}
                </div>
              </SideCard>
            </motion.div>
          </motion.aside>
        </motion.main>

        <footer className="mt-8 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-mono">Max history: {MAX_HISTORY}</span>
          <span>Built for laptop screens with responsive scaling.</span>
        </footer>
      </div>
    </div>
  );
}
