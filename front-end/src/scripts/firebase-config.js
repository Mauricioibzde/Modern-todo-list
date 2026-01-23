// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdQ97kGcUFJY9kTKycQY_ghZZDvIP8HzI",
  authDomain: "modern-to-do-list-8a8d5.firebaseapp.com",
  projectId: "modern-to-do-list-8a8d5",
  storageBucket: "modern-to-do-list-8a8d5.firebasestorage.app",
  messagingSenderId: "1050486262468",
  appId: "1:1050486262468:web:856e01ae7a967ab1951791",
  measurementId: "G-RH1ELB44G0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot };