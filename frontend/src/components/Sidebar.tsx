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
      className={`transition-all duration-300 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center font-bold">
              MH
            </div>
            <h1 className="font-bold text-lg">MHChat</h1>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
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
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewConversation}
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="p-4 text-center text-gray-400 text-sm">
            {isOpen ? "No conversations yet" : ""}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {convList.map((conv) => {
              const isSelected = conv.id === currentConversationId;
              const firstMessage = conv.messages?.[0]?.text || "New conversation";
              const preview = firstMessage.substring(0, 30);

              return (
                <div
                  key={conv.id}
                  onMouseEnter={() => setHoverId(conv.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`group relative transition-colors rounded-lg cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700 text-gray-200"
                  }`}
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className="w-full text-left px-3 py-3 flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      {isOpen && (
                        <>
                          <p className="text-sm font-medium truncate">{preview}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(conv.started_at).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                  {hoverId === conv.id && isOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-2 p-1 hover:bg-red-600/50 rounded transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
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
      <div className="p-4 border-t border-gray-700">
        {isOpen && (
          <button className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded transition-colors flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        )}
      </div>
    </div>
  );
};
