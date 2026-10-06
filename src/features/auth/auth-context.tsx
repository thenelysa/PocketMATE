'use client';

import { getSession, signOut } from './hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = 'pocketmate_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSession().then(value => { if (active) setUser(value); }).catch(() => { localStorage.removeItem(STORAGE_KEY); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    await signOut();
    queryClient.clear();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
