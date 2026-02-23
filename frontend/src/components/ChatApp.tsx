"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, LifeBuoy } from "lucide-react";
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

export default function ChatApp() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showHuman, setShowHuman] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supportEmail =
    (process.env.NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL || "support@example.com").trim();

  const historyForBrain = useMemo(() => {
    return messages
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.text }));
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
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
    <div className="h-dvh w-full">
      <div className="bg-background text-foreground flex h-full w-full overflow-hidden">
        <main className="relative flex h-full flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 text-sm">
            <div className="font-semibold">MHChat</div>
            <button
              onClick={() => setShowHuman(true)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-md border border-input px-3 py-2"
              type="button"
            >
              <LifeBuoy size={16} />
              Connect to human
            </button>
          </div>

          <div ref={scrollRef} className="flex h-full w-full flex-col overflow-auto px-4 py-6">
            <div className="mx-auto w-full max-w-[800px] space-y-4">
              {messages.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="text-3xl font-bold">Chat</div>
                  <div className="text-muted-foreground mt-2 text-sm">
                    Send a message to get a response.
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isBot = m.role === "assistant";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`${
                          isBot
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        } max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed`}
                      >
                        {m.text}

                        {isBot && m.kb_hits && m.kb_hits.length > 0 && !m.crisis && (
                          <div className="mt-3 rounded-md border border-border/60 bg-background/30 px-3 py-2">
                            <div className="text-xs font-semibold opacity-80">KB hits</div>
                            <ul className="mt-2 space-y-1 text-xs opacity-80">
                              {m.kb_hits.map((hit, idx) => (
                                <li key={`${m.id}-hit-${idx}`}>- {hit}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-2 text-xs opacity-60">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {sending && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  Assistant is typing...
                </div>
              )}

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="w-full px-4 pb-4">
            <div className="mx-auto flex w-full max-w-[800px] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={sending}
                placeholder="Type a message..."
                className="bg-background flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => void handleSend()}
                disabled={sending || !input.trim()}
                className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                type="button"
              >
                <Send size={16} />
                Send
              </button>
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

          {showHuman && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-background w-full max-w-lg rounded-lg border border-border p-5">
                <div className="text-lg font-semibold">Connect to a human</div>
                <div className="text-muted-foreground mt-2 text-sm">
                  This will open your email client to contact support.
                </div>
                <div className="mt-3 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                  {supportEmail}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={openMailTo}
                    className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-semibold"
                    type="button"
                  >
                    Email support
                  </button>
                  <button
                    onClick={() => setShowHuman(false)}
                    className="rounded-md border border-input px-3 py-2 text-sm"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
