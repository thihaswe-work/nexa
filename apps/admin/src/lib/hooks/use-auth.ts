'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useEffect, useCallback } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const { setUser, setAuthenticated, reset } = useAuthStore();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      setAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', session.accessToken);
      }
    } else if (status === 'unauthenticated') {
      reset();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('accessToken');
      }
    }
  }, [session, status, setUser, setAuthenticated, reset]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/login' });
  }, []);

  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    logout,
  };
}
