import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createTestQueryClient } from '../../test/testUtils';
import TagForm from '../TagForm';

// Mock the API module
vi.mock('../../lib/api', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockList = vi.fn();
  return {
    tagsApi: {
      list: mockList,
      get: vi.fn(),
      create: mockCreate,
      update: mockUpdate,
      delete: vi.fn(),
    },
  };
});

// Import mocks after module is mocked
const { tagsApi } = await import('../../lib/api');
const mockCreate = (tagsApi.create as ReturnType<typeof vi.fn>);
const mockUpdate = (tagsApi.update as ReturnType<typeof vi.fn>);

describe('TagForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: 1,
      name: 'New Tag',
      description: 'A new tag description',
      color: '#3B82F6',
      created_at: '2024-01-01T00:00:00Z',
    });
    mockUpdate.mockResolvedValue({
      id: 1,
      name: 'Updated Tag',
      description: 'Updated description',
      color: '#FF0000',
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  it('renders tag creation form', () => {
    render(<TagForm />);

    expect(screen.getByLabelText(/tag name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create tag/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<TagForm />);

    const submitButton = screen.getByRole('button', { name: /create tag/i });
    await user.click(submitButton);

    // Form should show validation error
    await waitFor(() => {
      expect(screen.getByText(/tag name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    render(<TagForm />, { queryClient });

    await user.type(screen.getByLabelText(/tag name/i), 'New Tag');
    await user.type(screen.getByLabelText(/description/i), 'A new tag description');
    await user.click(screen.getByRole('button', { name: /create tag/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'New Tag',
        description: 'A new tag description',
        color: expect.any(String),
      });
    });
  });

  it('pre-fills form when editing existing tag', () => {
    const existingTag = {
      id: 1,
      name: 'Existing Tag',
      description: 'Existing description',
      color: '#FF0000',
      created_at: '2024-01-01T00:00:00Z',
    };

    render(<TagForm tag={existingTag} />);

    expect(screen.getByDisplayValue('Existing Tag')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update tag/i })).toBeInTheDocument();
  });
});

