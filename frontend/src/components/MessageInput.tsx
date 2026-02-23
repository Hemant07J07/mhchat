"use client";

import React, { useState } from "react";

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  loading = false,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || loading || disabled) return;
    await onSend(message.trim());
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex gap-2">
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What's in your mind?"
          disabled={loading || disabled}
          className={`flex-1 resize-none border-2 rounded-2xl px-4 py-3 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-sm font-medium ${
            isFocused
              ? "border-blue-400 shadow-lg shadow-blue-100"
              : "border-gray-200 hover:border-gray-300"
          }`}
          rows={1}
          style={{ minHeight: "44px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={loading || disabled || !message.trim()}
          className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center flex-shrink-0"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 C22.9702544,11.6889879 22.9702544,11.6889879 22.9702544,11.6889879 L4.13399899,2.79156292 C3.34915502,2.40445923 2.40734225,2.51631624 1.77946707,3.08714285 C0.994623095,3.65796947 0.837654326,4.74742151 1.15159189,5.53286842 L3.03521743,12.0740126 C3.03521743,12.2311101 3.34915502,12.3881435 3.50612381,12.3881435 L16.6915026,13.1736305 C16.6915026,13.1736305 17.1624089,13.1736305 17.1624089,12.6315722 L17.1624089,12.0740126 C17.1624089,11.5318543 16.6915026,11.4744748 16.6915026,12.4744748 Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
