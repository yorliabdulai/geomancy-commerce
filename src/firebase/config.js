const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");
require('dotenv').config();

// Firebase configuration using environment variables
const firebaseConfig = {
   apiKey: process.env.VITE_API_KEY,
   authDomain: process.env.VITE_AUTH_DOMAIN,
   projectId: process.env.VITE_PROJECT_ID,
   storageBucket: process.env.VITE_STORAGE_BUCKET,
   messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
   appId: process.env.VITE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the initialized services
module.exports = {
   auth,
   db,
   storage,
   app
};