import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDAgm-5yrkAq-3vvHM2tMdFCflMzSdRQvc",
  authDomain: "valor-azul.firebaseapp.com",
  projectId: "valor-azul",
  storageBucket: "valor-azul.firebasestorage.app",
  messagingSenderId: "646024367342",
  appId: "1:646024367342:web:1db03b87991623e98877ff"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)