

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';
import { getCoachByPhone, hasManagerAccount } from './data';
import type { Coach } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  coachName: string | null;
  role: 'manager' | 'coach' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [role, setRole] = useState<AuthContextType['role']>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.phoneNumber) {
        setUser(user);
        
        const [coach, systemHasManager] = await Promise.all([
          getCoachByPhone(user.phoneNumber),
          hasManagerAccount()
        ]);
        
        if (coach) {
          setCoachName(`${coach.firstName} ${coach.lastName}`);
          // If no manager exists in the system, elevate the current user to manager.
          // This is a one-time bootstrap for the first user.
          if (!systemHasManager) {
            setRole('manager');
          } else {
            setRole(coach.role);
          }
        } else {
          setCoachName("מאמן");
          // If the user is authenticated but has no DB record, they can't be a manager.
          setRole('coach');
        }
      } else {
        setUser(null);
        setCoachName(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);
  
  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  };

  const value = { user, loading, signOut, coachName, role };

  return (
    <AuthContext.Provider value={value}>
        {loading ? <div className="flex h-screen items-center justify-center">טוען...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

    