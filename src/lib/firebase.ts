import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, GoogleAuthProvider, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getFunctions } from "firebase/functions"; // <-- Import getFunctions

const firebaseConfig = {
  apiKey: "AIzaSyA5cgwDmRnuA3Qm1_C88vzgi7cwDPz4jik",
  authDomain: "i-miei-pensieri.web.app",
  projectId: "mythic-cedar-z6tp2",
  storageBucket: "mythic-cedar-z6tp2.firebasestorage.app",
  messagingSenderId: "732185655993",
  appId: "1:732185655993:web:e3183beacbfed5c6a8f968"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});
export const googleProvider = new GoogleAuthProvider();

// Questo parametro è vitale per forzare la scrittura sul cloud condiviso
export const db = getFirestore(app, "ai-studio-3088714c-a3be-4ce3-a9cd-f94c8dd37474");
export const functions = getFunctions(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Persistence failed: Multiple tabs open");
  } else if (err.code == 'unimplemented') {
    console.warn("Persistence not supported by browser");
  }
});

if (typeof window !== "undefined") {
  if (import.meta.env.DEV) {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
}