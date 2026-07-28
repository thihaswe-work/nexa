require('@testing-library/jest-dom');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@nexa.com',
        displayName: 'Admin User',
        avatarUrl: null,
        role: 'admin',
        isActive: true,
        emailVerified: true,
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    themes: ['light', 'dark', 'system'],
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock next/link
jest.mock('next/link', () => {
  const React = require('react');
  return ({ children, href, ...props }) => {
    return React.createElement('a', { href, ...props }, children);
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const mockIcon = () => null;
  return new Proxy({}, {
    get: () => mockIcon,
  });
});

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
}));
