<<<<<<< HEAD
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// உனது Firebase Config (Already inserted!)
const firebaseConfig = {
  apiKey: "AIzaSyD8cKLno1Diksa2rCi8knljbiJcgD2TiR0",
  authDomain: "sentinelaa-1696c.firebaseapp.com",
  projectId: "sentinelaa-1696c",
  storageBucket: "sentinelaa-1696c.firebasestorage.app",
  messagingSenderId: "515655467889",
  appId: "1:515655467889:web:84b9b7f39cd8a2e6f06cd0",
  measurementId: "G-6DY9L0WQWD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const alertsCollection = collection(db, 'alerts');

// Alert-ah Firebase-ku anuppa
export const addAlert = async (alertData) => {
  try {
    await addDoc(alertsCollection, {
      ...alertData,
      timestamp: Date.now()
    });
    console.log("Alert added to Firebase!");
  } catch (error) {
    console.error("Error adding alert: ", error);
  }
};

// Firebase-la irundhu real-time alerts-ah listen panna
export const subscribeToAlerts = (callback) => {
  const q = query(alertsCollection, orderBy('timestamp', 'desc'), limit(50));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(alerts);
  }, (error) => {
    console.error("Error listening to alerts:", error);
  });
  
  return unsubscribe;
}
=======

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

>>>>>>> main
