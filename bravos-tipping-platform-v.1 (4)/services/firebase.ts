import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Let TypeScript know about the global firebaseConfig from init.js
declare global {
  interface Window {
    firebaseConfig?: Record<string, string>;
  }
}

// Default config from environment variables (for other platforms or local dev)
const getConfigFromEnv = () => ({
  apiKey: process.env.API_KEY || "placeholder-key",
  authDomain: process.env.AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: process.env.PROJECT_ID || "placeholder-project",
  storageBucket: process.env.STORAGE_BUCKET || "placeholder.appspot.com",
  messagingSenderId: process.env.MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: process.env.APP_ID || "placeholder-app-id",
});

// Use the Firebase Hosting config if available, otherwise fall back to environment variables.
const firebaseConfig = window.firebaseConfig || getConfigFromEnv();

// Declare services, allowing them to be null if not configured.
let app: firebase.app.App | null = null;
let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;
let storageClient: firebase.storage.Storage | null = null;

// Only initialize Firebase if the config is not using placeholders
if (firebaseConfig.apiKey !== "placeholder-key" && firebaseConfig.projectId !== "placeholder-project") {
    try {
        // Check if Firebase is already initialized to avoid errors on hot-reloads.
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app(); // Get existing app
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        storageClient = firebase.storage();
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Explicitly set to null to ensure feature-flagging works correctly downstream
        app = null;
        auth = null;
        db = null;
        storageClient = null;
    }
} else {
    console.warn(`
        Firebase configuration is missing.
        If deployed on Firebase Hosting, this is unexpected. Check your project setup.
        If running locally, set environment variables to enable Firebase features.
        The application is running in a limited, offline mode.
    `);
}


// Reusable image upload function
export const uploadImage = async (file: File, path: string): Promise<string> => {
    // If we're not configured, don't attempt to upload. Return a mock image.
    if (!storageClient) {
        console.warn("Firebase Storage not configured, returning mock image URL for upload.");
        return `https://picsum.photos/seed/${file.name.replace(/\s/g, '-')}/200`;
    }
    const storageRef = storageClient.ref(path);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
};

// Export the services for use in other parts of the app.
export { app, auth, db };