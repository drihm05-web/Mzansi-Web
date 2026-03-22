import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        
        // Initial profile fetch
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            // Self-repair: Create a default profile if missing
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: firebaseUser.email === 'drihm05@gmail.com' ? 'admin' : 'client',
              createdAt: new Date().toISOString()
            };
            await setDoc(profileRef, defaultProfile);
            setProfile(defaultProfile);
          }
        } catch (err) {
          console.error("Error fetching/repairing profile:", err);
        }

        // Real-time profile listener
        unsubscribeProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        }, (err) => {
          console.error("Profile listener error:", err);
        });

        // Always set loading to false after attempting to fetch profile
        setLoading(false);
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setLoading(false);
      }
    }, (err) => {
      console.error('onAuthStateChanged error:', err);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'drihm05@gmail.com';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
