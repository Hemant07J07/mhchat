"use client";

import React from "react";
import { Message as MessageType } from "@/lib/store";

interface MessageProps {
  message: MessageType;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-2 max-w-2xl ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
              AI
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-3 rounded-lg ${
              isUser
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-100 text-gray-900 rounded-bl-none"
            }`}
          >
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.text}</p>
          </div>
          <p
            className={`text-xs mt-1.5 ${
              isUser ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

interface MessageListProps {
  messages: MessageType[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-2 bg-white">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p>Start a conversation to see messages</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <Message key={msg.id || `msg-${index}`} message={msg} />
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="flex gap-2">
                <div className="flex-shrink-0 pt-1">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700">
                    🤖
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-100 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={endRef} />
    </div>
  );
};
