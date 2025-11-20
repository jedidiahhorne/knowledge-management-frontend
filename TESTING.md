# Testing Guide

This document describes the testing setup and strategies for the Knowledge Management Frontend.

## Testing Stack

- **Vitest** - Fast unit test framework, works seamlessly with Vite
- **React Testing Library** - Simple and complete testing utilities for React components
- **@testing-library/jest-dom** - Custom Jest matchers for DOM elements
- **@testing-library/user-event** - Simulate user interactions
- **jsdom** - DOM implementation for Node.js

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── components/
│   └── __tests__/          # Component unit tests
├── integration/
│   └── __tests__/          # Integration/workflow tests
├── lib/
│   └── __tests__/          # Utility function tests
└── test/
    ├── setup.ts            # Test configuration
    ├── testUtils.tsx       # Test utilities and helpers
    ├── mockData.ts         # Mock data for tests
    └── mocks/              # API mocking strategies
```

## Testing Strategies

### 1. Unit Tests

Unit tests focus on individual components in isolation. They test:
- Component rendering
- User interactions
- Props handling
- Conditional rendering
- Form validation

**Example:**
```typescript
import { render, screen } from '../../test/testUtils';
import LoginPage from '../LoginPage';

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Integration tests verify that multiple components work together correctly. They test:
- Complete user workflows
- API interactions
- State management across components
- Navigation flows

**Example:**
```typescript
describe('Authentication Workflow', () => {
  it('completes full login workflow', async () => {
    // Test login flow from start to finish
  });
});
```

### 3. API Mocking

API calls are mocked using Vitest's `vi.mock()` function. This allows:
- Testing without a real backend
- Controlling API responses
- Testing error scenarios
- Fast test execution

**Mocking Strategy:**
```typescript
// Mock the API module
vi.mock('../../lib/api', () => {
  const mockLogin = vi.fn();
  return {
    authApi: {
      login: mockLogin,
      // ... other methods
    },
  };
});

// Use the mock in tests
const { authApi } = await import('../../lib/api');
const mockLogin = authApi.login as ReturnType<typeof vi.fn>;
```

### 4. Test Utilities

The `testUtils.tsx` file provides:
- `render()` - Custom render function with all providers (QueryClient, Router, Auth)
- `createTestQueryClient()` - QueryClient with test-friendly defaults

**Usage:**
```typescript
import { render, createTestQueryClient } from '../../test/testUtils';

const queryClient = createTestQueryClient();
render(<MyComponent />, { queryClient });
```

## Best Practices

1. **Test User Behavior**: Focus on what users see and do, not implementation details
2. **Use Accessible Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock External Dependencies**: Always mock API calls and external services
4. **Clean Up**: Tests automatically clean up after each test
5. **Isolate Tests**: Each test should be independent and not rely on other tests
6. **Test Error States**: Include tests for error handling and edge cases

## Coverage Goals

- **Components**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **Integration Tests**: Cover all major user workflows

## Common Patterns

### Testing Forms
```typescript
const user = userEvent.setup();
await user.type(screen.getByLabelText(/email/i), 'test@example.com');
await user.click(screen.getByRole('button', { name: /submit/i }));
```

### Testing Async Operations
```typescript
await waitFor(() => {
  expect(mockApi.login).toHaveBeenCalled();
});
```

### Testing Navigation
```typescript
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
```

## Debugging Tests

1. Use `screen.debug()` to see the rendered output
2. Use `screen.logTestingPlaygroundURL()` to get query suggestions
3. Run tests in watch mode to see changes immediately
4. Use `test:ui` for a visual test runner

## Continuous Integration

Tests run automatically on:
- Pre-commit hooks (via Husky)
- Pull requests
- Before deployment

Ensure all tests pass before pushing code.

