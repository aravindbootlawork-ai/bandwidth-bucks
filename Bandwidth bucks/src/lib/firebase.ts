
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKey_1234567890",
  authDomain: "bandwidthbucks.firebaseapp.com",
  projectId: "bandwidthbucks",
  storageBucket: "bandwidthbucks.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:dummyappid"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
