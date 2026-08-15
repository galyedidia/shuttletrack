

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';
import { getCoachByPhone, hasManagerAccount, addCoach, updateCoach } from './data';
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
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.phoneNumber) {
        setUser(user);
        
        const systemHasManager = await hasManagerAccount();

        if (!systemHasManager) {
          let coach = await getCoachByPhone(user.phoneNumber);
        
          if (!coach) {
            // Create a coach doc for this user as a manager
            const [first, ...rest] = (user.displayName || "מנהל מערכת").split(" ");
            await addCoach(first || "מנהל", rest.join(" ") || "מערכת", user.phoneNumber, "manager");
            coach = await getCoachByPhone(user.phoneNumber);
          } else if (coach.role !== "manager") {
            // Promote existing coach to manager if needed
            await updateCoach(coach.id, { role: "manager" });
          }
        
          setCoachName(coach ? `${coach.firstName} ${coach.lastName}` : "מנהל מערכת");
          setRole("manager");
        } else {
          // Normal operation
          const coach = await getCoachByPhone(user.phoneNumber);
          if (coach) {
            setCoachName(`${coach.firstName} ${coach.lastName}`);
            setRole(coach.role);
          } else {
            setCoachName("משתמש לא רשום");
            setRole(null);
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
    if (loading) return;
  
    const onLogin = pathname === "/login";
  
    // Not signed in → allow only /login
    if (!user) {
      if (!onLogin) router.replace("/login");
      return;
    }
    
    // Signed in with a role → never stay on /login
    if (onLogin) router.replace("/");
  }, [loading, user, pathname, router]);  
  
  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
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
