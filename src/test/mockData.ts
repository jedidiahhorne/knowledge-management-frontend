import type { Note, Tag, Attachment, User } from '../lib/api';

export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  is_active: true,
  is_superuser: false,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockTag: Tag = {
  id: 1,
  name: 'test-tag',
  color: '#3B82F6',
  description: 'A test tag',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockTags: Tag[] = [
  mockTag,
  {
    id: 2,
    name: 'work',
    color: '#10B981',
    description: 'Work related',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'personal',
    color: '#F59E0B',
    description: 'Personal items',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockNote: Note = {
  id: 1,
  title: 'Test Note',
  content: 'This is a test note with some content.',
  is_pinned: false,
  is_archived: false,
  user_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tags: [mockTag],
  attachments: [],
};

export const mockNotes: Note[] = [
  mockNote,
  {
    id: 2,
    title: 'Another Note',
    content: 'More content here',
    is_pinned: true,
    is_archived: false,
    user_id: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    tags: [],
    attachments: [],
  },
];

export const mockAttachment: Attachment = {
  id: 1,
  filename: 'test.pdf',
  file_path: '1/test.pdf',
  file_size: 1024,
  mime_type: 'application/pdf',
  note_id: 1,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockAttachments: Attachment[] = [mockAttachment];

