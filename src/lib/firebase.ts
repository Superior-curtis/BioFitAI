import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDP2fPhVCjgGw6CNTCf18wCO0gda3vPAxM",
  authDomain: "biofit-e0e49.firebaseapp.com",
  projectId: "biofit-e0e49",
  storageBucket: "biofit-e0e49.firebasestorage.app",
  messagingSenderId: "182439215332",
  appId: "1:182439215332:web:84a665386cecc573b8acf1",
  measurementId: "G-VKDK4X72PZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
