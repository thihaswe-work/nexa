import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    accessToken: string;
    refreshToken: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      role: string;
      isActive: boolean;
      emailVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    error?: string;
  }
}
