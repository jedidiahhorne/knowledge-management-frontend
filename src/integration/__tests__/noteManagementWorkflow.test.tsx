import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createTestQueryClient } from '../../test/testUtils';
import NoteForm from '../../components/NoteForm';
import { mockNotes, mockTags } from '../../test/mockData';

// Mock the API module
vi.mock('../../lib/api', () => {
  const mockNotesCreate = vi.fn();
  const mockNotesUpdate = vi.fn();
  const mockTagsList = vi.fn();
  return {
    notesApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: mockNotesCreate,
      update: mockNotesUpdate,
      delete: vi.fn(),
    },
    tagsApi: {
      list: mockTagsList,
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// Import mocks after module is mocked
const { notesApi, tagsApi } = await import('../../lib/api');
const mockNotesCreate = (notesApi.create as ReturnType<typeof vi.fn>);
const mockTagsList = (tagsApi.list as ReturnType<typeof vi.fn>);

describe('Note Management Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTagsList.mockResolvedValue(mockTags);
    mockNotesCreate.mockResolvedValue(mockNotes[0]);
  });

  it('creates a new note with title and content', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(<NoteForm />, { queryClient });

    // Fill in form
    await user.type(screen.getByLabelText(/title/i), 'My New Note');
    await user.type(screen.getByLabelText(/content/i), '# Markdown Content\n\nThis is a test note.');

    // Submit
    await user.click(screen.getByRole('button', { name: /create note/i }));

    await waitFor(() => {
      expect(mockNotesCreate).toHaveBeenCalledWith({
        title: 'My New Note',
        content: '# Markdown Content\n\nThis is a test note.',
        tag_ids: undefined,
        is_pinned: false,
        is_archived: false,
      });
    });
  });

  it('creates note with selected tags', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(<NoteForm />, { queryClient });

    // Wait for tags to load
    await waitFor(() => {
      expect(screen.getByText(mockTags[0].name)).toBeInTheDocument();
    });

    // Fill in form
    await user.type(screen.getByLabelText(/title/i), 'Tagged Note');

    // Select a tag - use getAllByText and pick the first button
    await waitFor(() => {
      const tagButtons = screen.getAllByText(mockTags[0].name);
      expect(tagButtons.length).toBeGreaterThan(0);
    });
    const tagButtons = screen.getAllByText(mockTags[0].name);
    const tagButton = tagButtons.find((btn) => btn.tagName === 'BUTTON') || tagButtons[0];
    await user.click(tagButton);

    // Submit
    await user.click(screen.getByRole('button', { name: /create note/i }));

    await waitFor(() => {
      expect(mockNotesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tagged Note',
          tag_ids: [mockTags[0].id],
        })
      );
    });
  });

  it('toggles preview mode', async () => {
    const user = userEvent.setup();
    render(<NoteForm />);

    // Enter markdown content
    await user.type(screen.getByLabelText(/content/i), '# Heading\n\n**Bold text**');

    // Switch to preview mode
    await user.click(screen.getByRole('button', { name: /preview/i }));

    // Check that preview is shown
    await waitFor(() => {
      expect(screen.getByText('Heading')).toBeInTheDocument();
    });
  });
});

