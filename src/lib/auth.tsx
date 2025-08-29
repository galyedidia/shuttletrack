

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
        
        const systemHasManager = await hasManagerAccount();

        if (!systemHasManager) {
            // BOOTSTRAP: If no manager exists in the system, this user becomes the temporary manager
            // to allow them to create the first manager account (themselves).
            setRole('manager');
            const coach = await getCoachByPhone(user.phoneNumber);
            setCoachName(coach ? `${coach.firstName} ${coach.lastName}` : "מנהל מערכת");
        } else {
            // Normal operation: fetch the user's record and role from the DB.
            const coach = await getCoachByPhone(user.phoneNumber);
            if (coach) {
                setCoachName(`${coach.firstName} ${coach.lastName}`);
                setRole(coach.role);
            } else {
                // This case handles a user who is authenticated with Firebase
                // but doesn't have a record in the 'coaches' collection.
                // They are treated as a non-privileged user.
                setCoachName("משתמש לא רשום");
                setRole(null); // Or 'guest', effectively blocking access to everything.
            }
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
     // If a logged-in user without a role tries to access anything, send them to login.
     // This handles the case of a user deleted from the DB but still has a valid Firebase session.
    if (!loading && user && !role && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router, role]);
  
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
