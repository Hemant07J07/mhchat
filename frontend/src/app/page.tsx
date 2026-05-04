"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Sparkles, Loader2, ShieldAlert, LogOut, MessageSquare, Plus, Menu, X, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/lib/store";
import { api } from "@/lib/api";

function formatTime(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
}

function formatDateFull(iso: string) {
  if (!iso) return "Unknown date";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AppShell() {
  const router = useRouter();
  const {
    user,
    setUser,
    conversations,
    currentConversation,
    loadingConversations,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    logout
  } = useChatStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        setUser(storedUser);
      }
    } catch {}

    fetchConversations();
  }, [router, setUser, fetchConversations]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    logout();
    router.push("/login");
  };

  const handleCreateChat = async () => {
    await createConversation();
    if (window.innerWidth < 768) setMobileMenuOpen(false);
  };

  if (!mounted) return null;

  const sidebarClass = mobileMenuOpen 
    ? "flex fixed inset-y-0 left-0 w-full z-10 pt-16" 
    : "hidden md:flex md:static md:w-80 bg-white border-r border-slate-200 flex-col shadow-sm transition-all";

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <h1 className="font-semibold text-sm">MH Chat</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-slate-500">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`${sidebarClass} bg-white border-r border-slate-200 flex-col shadow-sm transition-all`}>
        <div className="hidden md:flex items-center gap-3 p-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight truncate">MH Chat</h1>
            <p className="text-xs text-slate-500 font-medium truncate">{user?.email || "Safe Space"}</p>
          </div>
        </div>

        <div className="px-4 pb-4 hidden md:block">
          <button 
            onClick={handleCreateChat}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> New Conversation
          </button>
        </div>

        <div className="md:hidden px-4 pt-4 pb-2 bg-white">
          <button 
            onClick={handleCreateChat}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-3 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={18} /> New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4 bg-white/50">
          {loadingConversations && conversations.length === 0 ? (
            <div className="flex justify-center p-4">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-xs text-slate-400 mt-10">No conversations yet.</p>
          ) : (
            conversations.map((conv) => {
              const isSelected = currentConversation?.id === conv.id;
              const itemClass = isSelected 
                ? "bg-indigo-50 border border-indigo-100/50" 
                : "hover:bg-slate-100 border border-transparent";
              const iconClass = isSelected ? "text-indigo-600" : "text-slate-400";
              const titleClass = isSelected ? "text-indigo-900" : "text-slate-700";

              return (
                <div
                  key={conv.id}
                  className={`group relative w-full text-left p-3 rounded-xl flex items-start gap-3 transition-colors ${itemClass}`}
                >
                  <button
                    onClick={() => {
                      selectConversation(conv.id);
                      if (window.innerWidth < 768) setMobileMenuOpen(false);
                    }}
                    className="flex-1 flex items-start gap-3"
                  >
                    <MessageSquare size={16} className={`mt-0.5 shrink-0 ${iconClass}`} />
                    <div className="min-w-0 pr-2">
                      <p className={`text-sm font-medium truncate ${titleClass}`}>
                        Chat #{conv.id}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {formatDateFull(conv.started_at)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this conversation? This cannot be undone.")) {
                        deleteConversation(conv.id);
                      }
                    }}
                    className="hidden group-hover:flex items-center justify-center shrink-0 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                    title="Delete conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-1.5 text-xs">
              <ShieldAlert size={14} /> Crisis Support
            </div>
            <p className="text-[10px] text-indigo-600/80 leading-relaxed">
              If in danger, call local emergency services immediately.
            </p>
          </div>
          <div className="space-y-2">
            <a 
              href="/profile"
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors p-2 rounded-lg"
            >
              <User size={14} /> Profile
            </a>
            <a 
              href="/help"
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors p-2 rounded-lg"
            >
              <Sparkles size={14} /> Help & Resources
            </a>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors p-2 mt-2 border-t border-slate-200 pt-3"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white min-h-0">
        {currentConversation ? (
          <ActiveChat />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <Bot size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Welcome to MH Chat</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
              Select an existing conversation from the sidebar or start a new safe space chat.
            </p>
            <button 
              onClick={handleCreateChat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors shadow-md shadow-indigo-200"
            >
              Start New Conversation
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ActiveChat() {
  const { currentConversation, messages, setMessages, appendMessage } = useChatStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !currentConversation) return;

    setIsTyping(false);
    setInput("");
    setAttachments([]);

    const token = localStorage.getItem("access_token");
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws/conversations/${currentConversation.id}/?token=${token}`;
    
    console.log("Connecting to", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS Connected for conversation", currentConversation.id);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS Message:", data);
        
        if (data.type === "initial_messages") {
          const sorted = [...(data.messages || [])].sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setMessages(sorted);
        } else if (data.type === "message") {
          const msg = data.message;
          
          // Check if this is a control message (has system field and no text or empty)
          if (msg?.system === "ai_typing") {
            setIsTyping(true);
            return;
          } else if (msg?.system === "ai_error") {
            console.error("AI Error:", msg.error);
            setIsTyping(false);
            return;
          }
          
          // Only add real chat messages (must have id, text, and sender)
          if (msg && msg.id && msg.text !== undefined && msg.sender && msg.text.trim()) {
            appendMessage(msg);
            // Stop typing indicator when we receive a bot response
            if (msg.sender === "bot" || msg.sender === "system") {
              setIsTyping(false);
            }
          }
        }
      } catch (err) {
        console.error("WS parsing error", err);
      }
    };

    ws.onclose = () => {
      console.log("WS Closed for conversation", currentConversation.id);
      setWsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [currentConversation?.id, mounted, setMessages, appendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const resolveFileUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const next = [...attachments, ...files].slice(0, 5);
    setAttachments(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    if (attachments.length > 0) {
      if (!currentConversation) return;
      try {
        setIsTyping(true);
        const formData = new FormData();
        formData.append("text", input.trim());
        formData.append("sender", "user");
        attachments.forEach((file) => formData.append("files", file));

        const response = await api.messages.createWithFiles(currentConversation.id, formData);
        const allMessages = response.data?.all_messages;
        if (Array.isArray(allMessages)) {
          setMessages(allMessages);
        }
        setInput("");
        setAttachments([]);
      } catch (err) {
        console.error("Attachment send failed", err);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        action: "send_message",
        text: input.trim(),
      })
    );

    setInput("");
    setIsTyping(true);
  };

  if (!mounted) return null;

  const connectionColor = wsConnected ? "bg-emerald-500" : "bg-rose-500";
  const connectionText = wsConnected ? "Secure connection active" : "Connecting...";

  return (
    <div className="flex flex-col h-full w-full gap-0">
      <header className="hidden md:flex items-center px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">Conversation #{currentConversation?.id}</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connectionColor}`} />
            <span className="text-[11px] text-slate-500 font-medium">{connectionText}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isAi = msg.sender === "bot" || msg.sender === "system";
            const isCrisis = msg.is_flagged;
            const bgClass = isAi
              ? isCrisis 
                ? "bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-sm" 
                : "bg-white text-slate-700 border border-slate-200 rounded-bl-sm"
              : "bg-indigo-600 text-white shadow-indigo-200 rounded-br-sm border border-indigo-500";

            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 items-end ${isAi ? "justify-start" : "justify-end"}`}
              >
                {isAi && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 ${msg.sender === "system" ? "bg-amber-100" : "bg-indigo-100"}`}>
                    <Bot size={16} className={msg.sender === "system" ? "text-amber-700" : "text-indigo-600"} />
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[75%] ${isAi ? "items-start" : "items-end"}`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${bgClass}`}>
                    {msg.text}
                  </div>
                  
                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {msg.attachments.map((att) => {
                        const isImage = att.content_type?.startsWith("image/");
                        const fileUrl = resolveFileUrl(att.file_url);
                        return (
                          <div key={att.id} className="rounded-xl border border-slate-200 bg-white/80 p-2">
                            {isImage && fileUrl ? (
                              <img
                                src={fileUrl}
                                alt={att.file_name}
                                className="max-h-56 w-auto rounded-lg border border-slate-200"
                              />
                            ) : (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                              >
                                {att.file_name}
                              </a>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              {att.content_type || "file"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ML Results for bot messages */}
                  {isAi && msg.ml_results && msg.ml_results.kb_hits && msg.ml_results.kb_hits.length > 0 && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg max-w-full">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Therapeutic Resource:</p>
                      {msg.ml_results.kb_hits.map((hit, idx) => (
                        <p key={idx} className="text-xs text-blue-800 leading-relaxed">
                          {hit}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Crisis Alert */}
                  {isAi && msg.ml_results?.crisis && (
                    <div className="mt-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg flex gap-2 items-start">
                      <ShieldAlert size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs font-semibold text-red-900">Crisis detected - emergency response activated</p>
                    </div>
                  )}
                  
                  <span className="text-[11px] text-slate-400 font-medium px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1">
                    <User size={16} className="text-slate-500" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mb-1">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-white border border-slate-200 shadow-sm flex items-center gap-1.5 h-[46px]">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
            </div>
          </motion.div>
        )}
      </div>

      <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 md:pb-6 px-4 md:px-8 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="relative flex flex-col gap-3 bg-white rounded-2xl shadow-lg border border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/50 transition-all px-4 py-3">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    <span className="truncate max-w-[180px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-500 hover:text-slate-700"
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.txt,.md,.csv,.json"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition"
                title="Attach files or images"
              >
                +
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share what's on your mind safely..."
                className="flex-1 py-2 bg-transparent outline-none text-[15px] text-gray-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || (!wsConnected && attachments.length === 0)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-[11px] text-slate-400 font-medium">
            AI-powered mental health companion. Do not use for medical emergencies.
          </div>
        </div>
      </div>
    </div>
  );
}
