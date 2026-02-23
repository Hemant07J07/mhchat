"use client";

import React from "react";
import { Conversation } from "@/lib/store";
import { useState } from "react";

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => Promise<void>;
  onDeleteConversation: (id: number) => Promise<void>;
  loading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  loading = false,
}) => {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // Ensure conversations is always an array
  const convList = Array.isArray(conversations) ? conversations : [];

  return (
    <div
      className={`transition-all duration-300 bg-white border-r border-gray-200 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              💬
            </div>
            <h1 className="font-bold text-base text-gray-900">MHChat</h1>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-600"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          disabled={loading}
          className="w-full py-2.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isOpen && "New Chat"}
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {convList.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-xs">
            {isOpen ? "No conversations yet" : ""}
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            {convList.map((conv) => {
              const isSelected = conv.id === currentConversationId;

              return (
                <div
                  key={conv.id}
                  onMouseEnter={() => setHoverId(conv.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="relative group"
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate ${
                      isSelected
                        ? "bg-blue-50 text-gray-900 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isOpen ? `Chat #${conv.id}` : ""}
                  </button>
                  {hoverId === conv.id && isOpen && (
                    <button
                      onClick={() => onDeleteConversation(conv.id)}
                      className="absolute right-2 top-2 p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {isOpen && (
          <>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              ⚙️ Settings
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              🚪 Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

