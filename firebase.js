// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Firestore
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth"; // Firebase Auth
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"; // For persistence

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjwY7Nq5cT8XvFK-aBe38weln8jamRCDM",
  authDomain: "kudumbashree-0.firebaseapp.com",
  projectId: "kudumbashree-0",
  storageBucket: "kudumbashree-0.firebasestorage.app",
  messagingSenderId: "847352295464",
  appId: "1:847352295464:web:1361fdc697abe52b41c51d",
  measurementId: "G-BL8ZPJ8934",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firebase = getFirestore(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Export the Firebase instances
export { firebase,firebaseConfig, auth };
