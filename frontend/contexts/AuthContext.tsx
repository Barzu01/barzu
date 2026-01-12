import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { userAPI } from '../services/api';
import { auth } from '../config/firebase';
import { onAuthStateChanged as firebaseOnAuthStateChanged } from 'firebase/auth';
import { firebaseSignOut } from '../services/firebaseAuth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.phoneNumber) {
        // User is signed in with Firebase
        try {
          const userData = await userAPI.createOrGet(firebaseUser.phoneNumber);
          await AsyncStorage.setItem('userPhone', firebaseUser.phoneNumber);
          setUser(userData);
        } catch (error) {
          console.error('Error syncing user with backend:', error);
          // Still set basic user info from Firebase
          setUser({
            phone: firebaseUser.phoneNumber,
            name: '',
            isAdmin: false,
            createdAt: new Date().toISOString(),
          } as User);
        }
      } else {
        // Check for locally stored user (fallback for web)
        await loadLocalUser();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadLocalUser = async () => {
    try {
      const phone = await AsyncStorage.getItem('userPhone');
      if (phone) {
        const userData = await userAPI.getUser(phone);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading local user:', error);
    }
  };

  const login = async (phone: string) => {
    try {
      const userData = await userAPI.createOrGet(phone);
      await AsyncStorage.setItem('userPhone', phone);
      setUser(userData);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase
      await firebaseSignOut();
      // Clear local storage
      await AsyncStorage.removeItem('userPhone');
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear local state even if Firebase logout fails
      await AsyncStorage.removeItem('userPhone');
      setUser(null);
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!user) return;
    try {
      const updatedUser = await userAPI.updateUser(user.phone, name);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
