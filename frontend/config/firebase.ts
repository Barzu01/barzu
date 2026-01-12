import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQf4a4Vi_LZibH4Vu5AFKw7c6YTgL4wHE",
  authDomain: "safedauto.firebaseapp.com",
  projectId: "safedauto",
  storageBucket: "safedauto.firebasestorage.app",
  messagingSenderId: "913244529190",
  appId: "1:913244529190:web:1b47a88d03916860323ce7",
  measurementId: "G-4R7GEEWY8L"
};

// Initialize Firebase
let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Initialize Auth with persistence for React Native
  if (Platform.OS !== 'web') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

export { app, auth };
export default app;
