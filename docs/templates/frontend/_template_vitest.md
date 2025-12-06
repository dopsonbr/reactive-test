# Vitest Test Template

## Usage

For unit and integration tests with React Testing Library.

## Structure

```tsx
// {component}.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { {Component} } from './{component}';

// Create fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('{Component}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default props', () => {
    render(<{Component}>Content</{Component}>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<{Component} onClick={handleClick}>Click me</{Component}>);

    await user.click(screen.getByRole('button', { name: /click me/i }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('fetches and displays data', async () => {
    render(
      <TestWrapper>
        <{Component} id="123" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Expected Content')).toBeInTheDocument();
    });
  });
});
```

## Testing with MSW (API Mocking)

```tsx
// {component}.test.tsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';

const server = setupServer(
  http.get('/api/products/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Product',
      price: 29.99,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('displays product data', async () => {
  render(
    <TestWrapper>
      <ProductDetail productId="123" />
    </TestWrapper>
  );

  await waitFor(() => {
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});

it('handles API errors', async () => {
  server.use(
    http.get('/api/products/:id', () => {
      return HttpResponse.json(
        { message: 'Not found' },
        { status: 404 }
      );
    })
  );

  render(
    <TestWrapper>
      <ProductDetail productId="999" />
    </TestWrapper>
  );

  await waitFor(() => {
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
```

## Testing Forms

```tsx
// LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

## Testing Custom Hooks

```tsx
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('initializes with provided value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

## Testing with TanStack Query

```tsx
// Using setQueryData for controlled testing
it('displays cached data', async () => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(['product', '123'], {
    id: '123',
    name: 'Cached Product',
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ProductDetail productId="123" />
    </QueryClientProvider>
  );

  // Data is immediately available from cache
  expect(screen.getByText('Cached Product')).toBeInTheDocument();
});
```

## Rules

1. **Use describe blocks** to group related tests
2. **Use userEvent over fireEvent** for realistic interactions
3. **Await async operations** with waitFor
4. **Mock external dependencies** with vi.mock
5. **Create fresh QueryClient per test** to avoid state leakage
6. **Test behavior, not implementation** - query by role, text, label

## Common Queries

```tsx
// By Role (preferred)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 1 });
screen.getByRole('textbox', { name: /email/i });

// By Label
screen.getByLabelText(/email address/i);

// By Text
screen.getByText(/welcome/i);

// By Test ID (last resort)
screen.getByTestId('custom-element');
```
