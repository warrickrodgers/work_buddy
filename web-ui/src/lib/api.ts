// web-ui/src/lib/api.ts
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

// Challenge types matching Prisma schema
export interface Challenge {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: 'COMMUNICATION' | 'PRODUCTIVITY' | 'LEADERSHIP' | 'CULTURE' | 'SKILLS' | 'PROCESS';
  challenge_type: 'HABIT' | 'SKILL' | 'BEHAVIOR' | 'PERFORMANCE' | 'ACCOUNTABILITY';
  audience_type: 'INDIVIDUAL' | 'TEAM' | 'ORGANIZATION';
  employee_id?: string | null;
  team_id?: string | null;
  start_date: string;
  end_date?: string | null;
  success_criteria: string;
  metrics?: string | null;
  ai_notes?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  progress: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  conversation_id?: number;
}

// Challenge API functions
export const challengeApi = {
  // Get all challenges for the current user
  getAll: async (userId: number): Promise<Challenge[]> => {
    try {
      const response = await api.get(`/challenges/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  },

  // Get a single challenge by ID
  getById: async (id: number): Promise<Challenge | null> => {
    try {
      const response = await api.get(`/challenges/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching challenge ${id}:`, error);
      return null;
    }
  },

  // Create a new challenge
  create: async (data: Partial<Challenge>): Promise<Challenge | null> => {
    try {
      const response = await api.post('/challenges', data);
      return response.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      return null;
    }
  },

  // Update a challenge
  update: async (id: number, data: Partial<Challenge>): Promise<Challenge | null> => {
    try {
      const response = await api.patch(`/challenges/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating challenge ${id}:`, error);
      return null;
    }
  },

  // Delete a challenge
  delete: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/challenges/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting challenge ${id}:`, error);
      return false;
    }
  }
};

export default api;