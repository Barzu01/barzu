import { auth } from '../config/firebase';
import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  RecaptchaVerifier,
  ConfirmationResult,
  ApplicationVerifier
} from 'firebase/auth';
import { Platform } from 'react-native';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

// Initialize reCAPTCHA verifier for web
export const initRecaptcha = (containerId: string): ApplicationVerifier | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
      return recaptchaVerifier;
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      return null;
    }
  }
  return null;
};

// Send verification code
export const sendVerificationCode = async (phoneNumber: string): Promise<boolean> => {
  try {
    // Format phone number
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    console.log('Sending code to:', formattedPhone);
    
    if (Platform.OS === 'web') {
      // For web, use reCAPTCHA
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }
      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    } else {
      // For native apps, Firebase handles verification differently
      // This requires expo-dev-client and proper native setup
      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, undefined as any);
    }
    
    console.log('Verification code sent successfully');
    return true;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

// Verify code and sign in
export const verifyCode = async (code: string): Promise<any> => {
  try {
    if (!confirmationResult) {
      throw new Error('No confirmation result. Please request a new code.');
    }
    
    const result = await confirmationResult.confirm(code);
    console.log('User signed in successfully:', result.user.phoneNumber);
    return result.user;
  } catch (error: any) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

// Sign out
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
    confirmationResult = null;
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChanged = (callback: (user: any) => void) => {
  return auth.onAuthStateChanged(callback);
};
