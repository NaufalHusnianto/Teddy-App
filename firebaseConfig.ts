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
  apiKey: "AIzaSyDrwHn5dUb2YejS5XCUe2MJKcPqese31RY",
  authDomain: "teddyapp-c6cc9.firebaseapp.com",
  databaseURL: "https://teddyapp-c6cc9-default-rtdb.firebaseio.com",
  projectId: "teddyapp-c6cc9",
  storageBucket: "teddyapp-c6cc9.firebasestorage.app",
  messagingSenderId: "660696993639",
  appId: "1:660696993639:web:41e16de6565bf27aa929c2",
  measurementId: "G-DC0P0SXKE6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
