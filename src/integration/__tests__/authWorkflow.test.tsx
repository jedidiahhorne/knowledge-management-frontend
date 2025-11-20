import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, createTestQueryClient } from '../../test/testUtils';
import LoginPage from '../../components/LoginPage';

// Mock the API module
vi.mock('../../lib/api', () => {
  const mockLogin = vi.fn();
  const mockGetCurrentUser = vi.fn();
  return {
    authApi: {
      login: mockLogin,
      getCurrentUser: mockGetCurrentUser,
      register: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    },
  };
});

// Import mocks after module is mocked
const { authApi } = await import('../../lib/api');
const mockLogin = (authApi.login as ReturnType<typeof vi.fn>);
const mockGetCurrentUser = (authApi.getCurrentUser as ReturnType<typeof vi.fn>);

describe('Authentication Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLogin.mockResolvedValue({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    });
    mockGetCurrentUser.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Test User',
      is_active: true,
      is_superuser: false,
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  it('completes full login workflow', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(<LoginPage />, { queryClient });

    // Enter credentials
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for API call
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });

    // Check that tokens are stored
    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('mock-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
    });
  });

  it('handles login error and displays message', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid username or password' } },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    // Tokens should not be stored on error
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

