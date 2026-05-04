import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Intercept requests to add JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for Django
    if (typeof window !== "undefined") {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiClient.post("/api/auth/login/", { email, password }),
    register: (email: string, password: string, username: string) =>
      apiClient.post("/api/auth/register/", { email, password, username }),
    logout: () => apiClient.post("/api/auth/logout/"),
    refreshToken: () => apiClient.post("/api/auth/token/refresh/"),
  },

  // Conversations
  conversations: {
    list: () => apiClient.get("/api/conversations/"),
    create: () => apiClient.post("/api/conversations/", {}),
    get: (id: number) => apiClient.get(`/api/conversations/${id}/`),
    update: (id: number, data: Record<string, any>) =>
      apiClient.patch(`/api/conversations/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/api/conversations/${id}/`),
  },

  // Messages
  messages: {
    list: (conversationId: number) =>
      apiClient.get(`/api/conversations/${conversationId}/messages/`),
    create: (conversationId: number, message: { text: string; sender?: string }) =>
      apiClient.post(`/api/conversations/${conversationId}/messages/`, {
        ...message,
        sender: message.sender || "user",
      }),
    createWithFiles: (conversationId: number, formData: FormData) =>
      apiClient.post(`/api/conversations/${conversationId}/messages/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    get: (conversationId: number, messageId: number) =>
      apiClient.get(`/api/conversations/${conversationId}/messages/${messageId}/`),
    delete: (conversationId: number, messageId: number) =>
      apiClient.delete(`/api/conversations/${conversationId}/messages/${messageId}/`),
  },

  // User Profile
  profile: {
    get: () => apiClient.get("/api/profile/"),
    update: (data: Record<string, any>) => apiClient.patch("/api/profile/", data),
    acceptConsent: () => apiClient.post("/api/profile/accept-consent/"),
  },
};

export default apiClient;
