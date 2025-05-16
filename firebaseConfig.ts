import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBoeO2ZU2DBnzNLHRr1m0Ywh5ySkzb4T2M",
  authDomain: "teddy-49fea.firebaseapp.com",
  databaseURL:
    "https://teddy-49fea-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "teddy-49fea",
  storageBucket: "teddy-49fea.firebasestorage.app",
  messagingSenderId: "790643351284",
  appId: "1:790643351284:web:b73a4b4c2b64ae96f3c8a1",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
