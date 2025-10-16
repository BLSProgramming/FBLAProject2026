import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyA45NbFAlnWmoGnDGdCTlW0JfQTe953mZc",
    authDomain: "login-f1297.firebaseapp.com",
    projectId: "login-f1297",
    storageBucket: "login-f1297.firebasestorage.app", 
    messagingSenderId: "139632640266", 
    appId: "1:139632640266:web:7cba0bf3941865f8c3faf3", 
    measurementId: "G-Q44KZ53V86" };

    
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();