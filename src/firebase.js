import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMY6GfXsg-f-ft111d4FZ74Np2eqCeCtg",
  authDomain: "open-banking-security-monitor.firebaseapp.com",
  projectId: "open-banking-security-monitor",
  storageBucket: "open-banking-security-monitor.firebasestorage.app",
  messagingSenderId: "755916615220",
  appId: "1:755916615220:web:8f54108e63cc79ce482461",
  measurementId: "G-0QDEGNV3DV"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);