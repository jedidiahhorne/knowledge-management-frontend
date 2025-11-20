// This file will be used by Vitest to mock the api module
import { vi } from 'vitest';
import { mockApi } from '../mocks/api';

// Mock the entire api module
vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual('../../lib/api');
  return {
    ...actual,
    authApi: mockApi.auth,
    notesApi: mockApi.notes,
    tagsApi: mockApi.tags,
    searchApi: mockApi.search,
    attachmentsApi: mockApi.attachments,
  };
});

export { mockApi };

