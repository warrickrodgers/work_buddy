import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // You could redirect to login or clear token here
      console.warn("Unauthorized – possibly expired token");
    }
    return Promise.reject(error);
  }
);

export default api;