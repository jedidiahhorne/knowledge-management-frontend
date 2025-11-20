import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../test/testUtils';
import HeaderSearchBar from '../HeaderSearchBar';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/search', search: '' }),
  };
});

describe('HeaderSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<HeaderSearchBar />);

    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument();
  });

  it('allows user to type in search input', async () => {
    const user = userEvent.setup();
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search notes/i);
    await user.type(input, 'test query');

    expect(input).toHaveValue('test query');
  });

  it('navigates to search page on form submit', async () => {
    const user = userEvent.setup();
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search notes/i);
    await user.type(input, 'test query');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
    });
  });

  it('shows clear button when input has value', async () => {
    const user = userEvent.setup();
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search notes/i);
    await user.type(input, 'test');

    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeaderSearchBar />);

    const input = screen.getByPlaceholderText(/search notes/i);
    await user.type(input, 'test');

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });
});

