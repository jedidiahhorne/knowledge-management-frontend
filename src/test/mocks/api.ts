import { vi } from 'vitest';
import { mockNotes, mockTags, mockNote, mockTag, mockAttachment, mockAttachments } from '../mockData';
import type { SearchNotesResponse, SearchTagsResponse } from '../../lib/api';

// Mock the API module
export const mockApi = {
  auth: {
    login: vi.fn().mockResolvedValue({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    }),
    register: vi.fn().mockResolvedValue({
      message: 'User registered successfully',
    }),
    getCurrentUser: vi.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Test User',
      is_active: true,
      is_superuser: false,
      created_at: '2024-01-01T00:00:00Z',
    }),
    requestPasswordReset: vi.fn().mockResolvedValue({
      message: 'Password reset email sent',
    }),
    resetPassword: vi.fn().mockResolvedValue({
      message: 'Password reset successfully',
    }),
  },
  notes: {
    list: vi.fn().mockResolvedValue(mockNotes),
    get: vi.fn().mockResolvedValue(mockNote),
    create: vi.fn().mockResolvedValue(mockNote),
    update: vi.fn().mockResolvedValue(mockNote),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  tags: {
    list: vi.fn().mockResolvedValue(mockTags),
    get: vi.fn().mockResolvedValue(mockTag),
    create: vi.fn().mockResolvedValue(mockTag),
    update: vi.fn().mockResolvedValue(mockTag),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  search: {
    searchNotes: vi.fn().mockResolvedValue<SearchNotesResponse>({
      notes: mockNotes,
      total: mockNotes.length,
      skip: 0,
      limit: 20,
    }),
    searchTags: vi.fn().mockResolvedValue<SearchTagsResponse>({
      tags: mockTags,
      total: mockTags.length,
      skip: 0,
      limit: 100,
    }),
  },
  attachments: {
    list: vi.fn().mockResolvedValue(mockAttachments),
    get: vi.fn().mockResolvedValue(mockAttachment),
    upload: vi.fn().mockResolvedValue(mockAttachment),
    download: vi.fn().mockResolvedValue(new Blob(['test content'], { type: 'application/pdf' })),
    delete: vi.fn().mockResolvedValue(undefined),
  },
};

// Helper to reset all mocks
export const resetMocks = () => {
  Object.values(mockApi.auth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  Object.values(mockApi.notes).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  Object.values(mockApi.tags).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  Object.values(mockApi.search).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  Object.values(mockApi.attachments).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
};

