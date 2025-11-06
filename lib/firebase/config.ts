// Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Your web app's Firebase configuration
// TODO: Replace with your Firebase config
// You can find this in your Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDWUtNjPtRrjyZUzfeU9GjbrXsyLjW4GQs",
  authDomain: "sistema-facturacion-jce.firebaseapp.com",
  projectId: "sistema-facturacion-jce",
  storageBucket: "sistema-facturacion-jce.firebasestorage.app",
  messagingSenderId: "469593077938",
  appId: "1:469593077938:web:e235e062224df0f8a9f1ab",
  measurementId: "G-Y3T633F23T"
};

// Initialize Firebase
let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let storage: FirebaseStorage | undefined

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  
  db = getFirestore(app)
  auth = getAuth(app)
  storage = getStorage(app)
}

export { app, db, auth, storage }

