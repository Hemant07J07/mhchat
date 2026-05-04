import { create } from "zustand";
import { api } from "./api";

export interface MLResults {
  intent?: string;
  intent_score?: number;
  crisis?: boolean;
  kb_hits?: string[];
}

export interface MessageAttachment {
  id: number;
  file_url: string;
  file_name: string;
  content_type: string;
  file_size: number;
  created_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: "user" | "bot" | "system";
  text: string;
  created_at: string;
  is_flagged: boolean;
  nlp_metadata?: Record<string, any>;
  ml_results?: MLResults;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: number;
  user: number;
  started_at: string;
  ended_at: string | null;
  metadata: Record<string, any>;
  messages?: Message[];
}

interface ChatStore {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loadingConversations: boolean;

  // Messages
  messages: Message[];
  loadingMessages: boolean;
  sendingMessage: boolean;

  // User
  user: { id: number; email: string; username: string } | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  createConversation: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;

  // Actions - Messages
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  addMessageOptimistic: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;

  // Actions - Auth
  setUser: (user: any) => void;
  logout: () => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  loadingConversations: false,
  messages: [],
  loadingMessages: false,
  sendingMessage: false,
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Conversations actions
  fetchConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const response = await api.conversations.list();
      // Handle both array and object (paginated) responses
      const convList = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || [];
      set({ conversations: convList, loadingConversations: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch conversations",
        loadingConversations: false,
      });
    }
  },

  createConversation: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const response = await api.conversations.create();
      set((state) => ({
        conversations: [response.data, ...state.conversations],
        currentConversation: response.data,
        messages: [],
        loadingConversations: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to create conversation",
        loadingConversations: false,
      });
    }
  },

  selectConversation: async (id: number) => {
    set({ loadingMessages: true, error: null });
    try {
      const convResponse = await api.conversations.get(id);
      const messagesResponse = await api.messages.list(id);

      // Handle both array and object (paginated) responses
      const msgList = Array.isArray(messagesResponse.data)
        ? messagesResponse.data
        : messagesResponse.data?.results || [];

      set({
        currentConversation: convResponse.data,
        messages: msgList,
        loadingMessages: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to load conversation",
        loadingMessages: false,
      });
    }
  },

  deleteConversation: async (id: number) => {
    try {
      await api.conversations.delete(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation:
          state.currentConversation?.id === id ? null : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to delete conversation",
      });
    }
  },

  // Messages actions
  fetchMessages: async (conversationId: number) => {
    set({ loadingMessages: true, error: null });
    try {
      const response = await api.messages.list(conversationId);
      // Handle both array and object (paginated) responses
      const msgList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      set({ messages: msgList, loadingMessages: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch messages",
        loadingMessages: false,
      });
    }
  },

  addMessageOptimistic: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setMessages: (messages: Message[]) => {
    set({ messages });
  },

  appendMessage: (message: Message) => {
    set((state) => {
      // Prevent duplicates if already exists
      if (state.messages.some(m => m.id === message.id)) return state;
      return {
        messages: [...state.messages, message],
      };
    });
  },

  sendMessage: async (text: string) => {
    const state = get();
    if (!state.currentConversation) return;

    const optimisticMessage: Message = {
      id: Date.now(),
      conversation: state.currentConversation.id,
      sender: "user",
      text,
      created_at: new Date().toISOString(),
      is_flagged: false,
    };

    set({ sendingMessage: true, error: null });
    state.addMessageOptimistic(optimisticMessage);

    try {
      const response = await api.messages.create(state.currentConversation.id, {
        text,
        sender: "user",
      });

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === optimisticMessage.id ? response.data : m
        ),
        sendingMessage: false,
      }));

      // Refetch messages after a short delay to get bot's reply
      // Celery task runs asynchronously, so we poll for the response
      setTimeout(async () => {
        try {
          await state.fetchMessages(state.currentConversation!.id);
        } catch (error) {
          console.error("Failed to refetch messages:", error);
        }
      }, 2000); // Wait 2 seconds for bot to respond
    } catch (error: any) {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== optimisticMessage.id),
        sendingMessage: false,
        error: error.response?.data?.detail || "Failed to send message",
      }));
    }
  },

  // Auth actions
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      conversations: [],
      currentConversation: null,
      messages: [],
    });
  },

  setError: (error) => {
    set({ error });
  },
}));
