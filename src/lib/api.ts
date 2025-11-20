import axios from 'axios';

// Get API base URL, ensuring we use public URL, not internal Railway URL
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If no URL is set, use localhost for development
  if (!envUrl || envUrl === '__API_BASE_URL__') {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      console.warn('No VITE_API_BASE_URL set, but page is HTTPS. This will cause issues.');
    }
    return 'http://localhost:8000/api/v1';
  }
  
  // Ensure URL is absolute (starts with http:// or https://)
  let apiUrl = envUrl.trim();
  
  // Log original value for debugging
  if (typeof window !== 'undefined') {
    console.log('[API] Original VITE_API_BASE_URL:', envUrl);
    console.log('[API] Page protocol:', window.location.protocol);
  }
  
  // If URL doesn't start with http:// or https://, add https://
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    console.warn('[API] VITE_API_BASE_URL missing protocol, adding https://');
    apiUrl = `https://${apiUrl}`;
  }
  
  // ALWAYS convert HTTP to HTTPS if page is loaded over HTTPS (mixed content security)
  // This is critical for production deployments on Railway
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
    console.warn('[API] Converting HTTP to HTTPS to avoid mixed content errors');
    console.warn('[API] Original URL:', apiUrl);
    apiUrl = apiUrl.replace(/^http:\/\//, 'https://');
    console.warn('[API] Converted URL:', apiUrl);
  }
  
  // Replace Railway internal URLs with public URLs
  // Railway provides internal URLs like: https://service.railway.internal
  // These need to be replaced with public URLs: https://service.up.railway.app
  if (apiUrl.includes('railway.internal')) {
    console.warn('[API] Railway internal URL detected. Please set VITE_API_BASE_URL to the public URL.');
    // Try to convert internal URL to public URL
    apiUrl = apiUrl.replace(/\.railway\.internal/g, '.up.railway.app');
    console.warn('[API] Attempting to use:', apiUrl);
  }
  
  // Remove trailing slash if present
  apiUrl = apiUrl.replace(/\/$/, '');
  
  // Final log
  if (typeof window !== 'undefined') {
    console.log('[API] Final API Base URL:', apiUrl);
  }
  
  return apiUrl;
}

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests and force HTTPS
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // CRITICAL: Force HTTPS if page is loaded over HTTPS (mixed content security)
  // This ensures all requests use HTTPS even if baseURL was set to HTTP
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (config.url && config.url.startsWith('http://')) {
      console.warn('[API] Interceptor converting HTTP to HTTPS:', config.url);
      config.url = config.url.replace(/^http:\/\//, 'https://');
    }
    if (config.baseURL && config.baseURL.startsWith('http://')) {
      console.warn('[API] Interceptor converting baseURL HTTP to HTTPS:', config.baseURL);
      config.baseURL = config.baseURL.replace(/^http:\/\//, 'https://');
    }
    // Also check the full URL that axios will construct
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url || ''}` : config.url;
    if (fullUrl && fullUrl.startsWith('http://')) {
      console.warn('[API] Interceptor converting full URL HTTP to HTTPS:', fullUrl);
      // Update baseURL to force HTTPS
      if (config.baseURL) {
        config.baseURL = config.baseURL.replace(/^http:\/\//, 'https://');
      }
    }
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
};

