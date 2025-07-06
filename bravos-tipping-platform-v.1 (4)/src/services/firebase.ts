
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

let app: firebase.app.App | null = null;
let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;
let storage: firebase.storage.Storage | null = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
} else {
  console.warn("Firebase configuration is missing from environment variables. Firebase features will be disabled.");
}

// Reusable image upload function
export const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!storage) {
        console.warn("Firebase Storage not configured, returning mock image URL for upload.");
        return `https://picsum.photos/seed/${file.name.replace(/\s/g, '-')}/200`;
    }
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
};


export { app, auth, db, storage };
