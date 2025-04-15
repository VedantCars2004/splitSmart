// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAILhVlgj-7HeZKjCgOB1qS51gHliCTJWM",
  authDomain: "splitsmart-fd906.firebaseapp.com",
  projectId: "splitsmart-fd906",
  storageBucket: "splitsmart-fd906.appspot.com",
  messagingSenderId: "96317904482",
  appId: "1:96317904482:web:6d52e9364155d2c64f233b",
  measurementId: "G-XYE5T8S8KS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);