"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
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

function PanelHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="relative px-10 pt-10 pb-4">
      <div className="text-center text-3xl font-semibold tracking-tight text-white">mhchat</div>
      {subtitle ? (
        <div className="mt-4 text-center text-[10px] font-semibold tracking-[0.35em] text-white/55">
          {subtitle}
        </div>
      ) : null}

      <div className="absolute right-6 top-6 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-white/10" />
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <div className="h-2 w-2 rounded-full bg-blue-500" />
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";

  const botBubble = "bg-blue-500/90 text-white";
  const userBubble = "bg-emerald-400/80 text-white";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[72%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-[12px] leading-relaxed ${
            isUser ? userBubble : botBubble
          } ${isUser ? "rounded-br-md" : "rounded-bl-md"}`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
        <div className="mt-1 text-[10px] text-white/35">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
}

function NavPanel() {
  return (
    <div className="w-[200px] shrink-0">
      <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
        <div className="text-[11px] font-semibold text-white/70">Home</div>
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/70">Home</div>
          <div className="rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/70">Profile</div>
          <div className="rounded-lg bg-amber-400/25 px-3 py-2 text-[12px] font-semibold text-amber-200 ring-1 ring-amber-200/30">
            Emergency Response
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/70">Settings</div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="text-[11px] text-white/50"> </div>
          <div className="h-5 w-9 rounded-full bg-emerald-400/60 p-[2px]">
            <div className="h-4 w-4 rounded-full bg-white/90" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBasePanel({ hits }: { hits: string[] }) {
  const items = hits.length
    ? hits.slice(0, 4)
    : [
        "Coping with Anxiety",
        "Mindfulness",
        "Breathing exercises",
        "Grounding technique",
      ];

  return (
    <div className="w-[210px] shrink-0">
      <div className="rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
        <div className="text-[11px] font-semibold text-white/70">Knowledge Base</div>
        <div className="mt-3 space-y-2">
          {items.map((t, i) => (
            <div key={`${t}-${i}`} className="rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/70">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomInput({
  input,
  setInput,
  sending,
  onSend,
}: {
  input: string;
  setInput: (v: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 items-center gap-3 rounded-full bg-white/6 px-4 py-2 ring-1 ring-white/10">
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
          className="min-w-0 flex-1 bg-transparent text-[12px] text-white placeholder:text-white/35 outline-none"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={sending || !input.trim()}
          className="text-white/60 hover:text-white disabled:opacity-40"
          title="Send"
        >
          <ArrowRight size={18} />
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
      if (m.role === "assistant" && Array.isArray(m.kb_hits) && m.kb_hits.length) return m.kb_hits;
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
      "Hi, I’d like to connect to a human for support.\n\n(You can optionally paste relevant context here.)"
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-slate-100 px-10 py-10">
      <div
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-[44px] bg-slate-950 shadow-2xl ring-1 ring-black/10"
        style={{ height: "min(780px, calc(100dvh - 80px))" }}
      >
        <div className="relative h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
          <PanelHeader subtitle="" />

          <div className="flex h-[calc(100%-128px)] flex-col">
            <div className="flex flex-1 gap-8 px-10">
              <NavPanel />

              <div className="flex min-w-0 flex-1 flex-col">
                {error && (
                  <div className="mb-3 flex justify-center">
                    <div className="rounded-md bg-white/10 px-3 py-1 text-xs text-white/80">{error}</div>
                  </div>
                )}

                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-auto pb-6"
                  style={{ scrollbarGutter: "stable" }}
                >
                  {messages.length === 0 ? (
                    <div className="pt-16 text-center text-sm text-white/45">Type a message to start.</div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {messages.map((m) => (
                        <ChatBubble key={m.id} message={m} />
                      ))}
                      {sending && (
                        <div className="text-center text-xs text-white/45">Assistant is typing…</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <KnowledgeBasePanel hits={latestKbHits} />
            </div>

            <div className="flex items-center gap-8 px-10 pb-8">
              <div className="w-[200px] shrink-0" />
              <div className="min-w-0 flex-1">
                <BottomInput
                  input={input}
                  setInput={setInput}
                  sending={sending}
                  onSend={() => void handleSend()}
                />
              </div>
              <div className="w-[210px] shrink-0" />
            </div>
          </div>
        </div>
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
