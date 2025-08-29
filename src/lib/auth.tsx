
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';
import { getCoachByPhone } from './data';
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
        // Fetch coach data from Firestore
        const coach = await getCoachByPhone(user.phoneNumber);
        if (coach) {
          setCoachName(`${coach.firstName} ${coach.lastName}`);
          setRole(coach.role);
        } else {
          setCoachName("מאמן");
          setRole(null); // Or 'coach' as a default if non-manager users can exist without a db entry
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

    