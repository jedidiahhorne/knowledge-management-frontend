import axios from 'axios';

// Get API base URL, ensuring we use public URL, not internal Railway URL
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If no URL is set, use localhost for development
  if (!envUrl || envUrl === '__API_BASE_URL__') {
    return 'http://localhost:8000/api/v1';
  }
  
  // Ensure URL is absolute (starts with http:// or https://)
  let apiUrl = envUrl.trim();
  
  // If URL doesn't start with http:// or https://, add https://
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `https://${apiUrl}`;
  }
  
  // Convert HTTP to HTTPS if page is loaded over HTTPS (mixed content security)
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
    apiUrl = apiUrl.replace(/^http:\/\//, 'https://');
  }
  
  // Replace Railway internal URLs with public URLs
  if (apiUrl.includes('railway.internal')) {
    apiUrl = apiUrl.replace(/\.railway\.internal/g, '.up.railway.app');
  }
  
  // Remove trailing slash if present
  apiUrl = apiUrl.replace(/\/$/, '');
  
  return apiUrl;
}

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token: new_refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          if (new_refresh_token) {
            localStorage.setItem('refresh_token', new_refresh_token);
          }
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login/json', { username, password });
    return response.data;
  },
  
  register: async (email: string, username: string, password: string, fullName?: string) => {
    const response = await api.post('/auth/register', {
      email,
      username,
      password,
      full_name: fullName,
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/password-reset-request', { email });
    return response.data;
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/password-reset', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Search API
export interface SearchNotesParams {
  query?: string;
  tag_ids?: number[];
  tag_names?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  skip?: number;
  limit?: number;
}

export interface Note {
  id: number;
  title: string;
  content: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  attachments: Attachment[];
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface Attachment {
  id: number;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
}

export interface SearchNotesResponse {
  notes: Note[];
  total: number;
  skip: number;
  limit: number;
}

export interface SearchTagsResponse {
  tags: Tag[];
  total: number;
  skip: number;
  limit: number;
}

export const searchApi = {
  searchNotes: async (params: SearchNotesParams): Promise<SearchNotesResponse> => {
    const response = await api.get('/search/notes', { params });
    return response.data;
  },
  
  searchTags: async (query?: string, skip = 0, limit = 100): Promise<SearchTagsResponse> => {
    const response = await api.get('/search/tags', {
      params: { query, skip, limit },
    });
    return response.data;
  },
};

// Notes API
export const notesApi = {
  list: async (params?: {
    skip?: number;
    limit?: number;
    tag_ids?: number[];
    search?: string;
    is_pinned?: boolean;
    is_archived?: boolean;
  }) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },
  
  get: async (id: number) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },
  
  create: async (data: { title: string; content?: string; tag_ids?: number[] }) => {
    const response = await api.post('/notes', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<{ title: string; content: string; tag_ids: number[] }>) => {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/notes/${id}`);
  },
};

// Tags API
export const tagsApi = {
  list: async (params?: { skip?: number; limit?: number; search?: string }) => {
    const response = await api.get('/tags', { params });
    return response.data;
  },
  
  get: async (id: number) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },
  
  create: async (data: { name: string; color?: string; description?: string }) => {
    const response = await api.post('/tags', data);
    return response.data;
  },
  
  update: async (id: number, data: { name?: string; color?: string; description?: string }) => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/tags/${id}`);
  },
};

