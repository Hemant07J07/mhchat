"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/store";
import { MessageList } from "@/components/Message";
import { MessageInput } from "@/components/MessageInput";

export default function Home() {
  const {
    conversations,
    currentConversation,
    messages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
  } = useChatStore();

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Create initial conversation if none exists
  useEffect(() => {
    const convList = Array.isArray(conversations) ? conversations : [];
    if (convList.length === 0 && !loadingConversations && !currentConversation) {
      createConversation();
    }
  }, [conversations, loadingConversations, currentConversation, createConversation]);

  // Auto-select first conversation if not selected
  useEffect(() => {
    const convList = Array.isArray(conversations) ? conversations : [];
    if (convList.length > 0 && !currentConversation) {
      selectConversation(convList[0].id);
    }
  }, [conversations, currentConversation, selectConversation]);

  const handleSendMessage = async (text: string) => {
    if (!currentConversation) return;
    await sendMessage(text);
  };

  const convList = Array.isArray(conversations) ? conversations : [];

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <div className="w-80 bg-white flex flex-col overflow-hidden shadow-lg">
        {/* Sidebar Header with Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">CHAT A.I+</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="5" cy="12" r="2" />
              </svg>
            </button>
          </div>
          <button
            onClick={createConversation}
            disabled={loadingConversations}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>

        {/* Your conversations */}
        <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Your conversations
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {convList.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No conversations yet</div>
          ) : (
            convList.map((conv) => {
              const firstMessage = conv.messages?.[0]?.text || `Create HTML Game Environment...`;
              const preview = firstMessage.substring(0, 40) + (firstMessage.length > 40 ? "..." : "");
              const isSelected = conv.id === currentConversation?.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all group cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-100 to-blue-50 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{preview}</p>
                  </div>
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Last 7 Days */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Last 7 Days
        </div>

        {/* Last 7 Days Items */}
        <div className="px-2 pb-4 space-y-1 text-sm text-gray-600 max-h-32 overflow-y-auto">
          <div className="px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2">
            <span>📊</span>
            <span className="truncate">Crypto Lending App Name</span>
          </div>
          <div className="px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2">
            <span>👨‍💼</span>
            <span className="truncate">Operator Grammar Types</span>
          </div>
          <div className="px-4 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-2">
            <span>🏪</span>
            <span className="truncate">Mini Stores For Bakery DFA</span>
          </div>
        </div>

        {/* Settings & User */}
        <div className="p-4 border-t border-gray-100 space-y-3 mt-auto">
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            Settings
          </button>
          <div className="px-4 py-3 flex items-center gap-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AN
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">Andrew Neilson</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Messages Area */}
        {currentConversation ? (
          <>
            <MessageList messages={messages} loading={loadingMessages} />
            <div className="border-t border-gray-200 bg-white px-8 py-6">
              <MessageInput
                onSend={handleSendMessage}
                loading={sendingMessage}
                disabled={!currentConversation}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CHAT A.I+</h3>
              <p className="text-gray-600 mb-6">Start a new conversation to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
