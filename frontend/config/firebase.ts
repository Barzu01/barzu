import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };
export default app;
