import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "flow-studio-backend",
  appId: "1:659081253236:web:b424cd30f21c532d2b1c21",
  storageBucket: "flow-studio-backend.firebasestorage.app",
  apiKey: "AIzaSyB-sh3kHbeSUpIj7iiwk2GMB042pv-ZDUk",
  authDomain: "flow-studio-backend.firebaseapp.com",
  messagingSenderId: "659081253236",
  measurementId: "G-CWTEKJWZ38"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
