import { initializeApp } from "firebase/app";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "fintech-hackathon-4505b.firebaseapp.com",
  projectId: "fintech-hackathon-4505b",
  storageBucket: "fintech-hackathon-4505b.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);


// ==========================================
// ADD ALERT
// ==========================================

export const addAlert = async (alertData) => {
  try {
    const docRef = await addDoc(
      collection(db, "alerts"),
      {
        ...alertData,
        createdAt: serverTimestamp(),
      }
    );

    console.log("✅ Alert saved:", docRef.id);

    return docRef.id;

  } catch (error) {
    console.error("❌ Error adding alert:", error);
    throw error;
  }
};


// ==========================================
// SUBSCRIBE TO ALERTS
// ==========================================

export const subscribeToAlerts = (callback) => {
  try {
    const alertsRef = collection(db, "alerts");

    const q = query(
      alertsRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const alerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔔 Alerts received:", alerts);

        callback(alerts);
      },

      (error) => {
        console.error(
          "❌ Error listening to alerts:",
          error
        );
      }
    );

    return unsubscribe;

  } catch (error) {
    console.error(
      "❌ Alert subscription failed:",
      error
    );

    return () => {};
  }
};


export default app;