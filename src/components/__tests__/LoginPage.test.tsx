import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/testUtils';
import LoginPage from '../LoginPage';

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
    // Export mocks for use in tests
    __mocks__: {
      mockLogin,
      mockGetCurrentUser,
    },
  };
});

// Import mocks after module is mocked
const { authApi } = await import('../../lib/api');
const mockLogin = (authApi.login as ReturnType<typeof vi.fn>);
const mockGetCurrentUser = (authApi.getCurrentUser as ReturnType<typeof vi.fn>);

describe('LoginPage', () => {
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

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('allows user to enter credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('submits form with credentials', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    // Delay the mock response
    mockLogin.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ access_token: 'token', refresh_token: 'refresh' }), 100))
    );

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });
});

