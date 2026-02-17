import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmd8W52-KR9eCp3u2nwtTjWH1UXbtZ0SY",
  authDomain: "order-app-370e0.firebaseapp.com",
  projectId: "order-app-370e0",
  storageBucket: "order-app-370e0.firebasestorage.app",
  messagingSenderId: "151902613208",
  appId: "1:151902613208:web:abe9f40d58366057ce71ad",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
