import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from "firebase/messaging";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, messaging, analytics;

try {
    if (firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        
        isAnalyticsSupported().then((supported) => {
            if (supported) {
                analytics = getAnalytics(app);
            } else {
                console.warn("[FIREBASE] Analytics is not supported in this environment.");
            }
        }).catch((err) => {
            console.warn("[FIREBASE] Analytics support check failed:", err.message);
        });

        isMessagingSupported().then((supported) => {
            if (supported) {
                messaging = getMessaging(app);
            } else {
                console.warn("[FIREBASE] Messaging is not supported in this environment (e.g. non-secure origin).");
            }
        }).catch((err) => {
            console.warn("[FIREBASE] Messaging support check failed:", err.message);
        });
    } else {
        console.warn("[FIREBASE] Config is missing. Push notifications will operate in mock mode.");
    }
} catch (error) {
    console.error("[FIREBASE] Initialization error:", error);
}

export const requestFirebaseToken = async () => {
  try {
    const supported = await isMessagingSupported();
    if (!supported) return null;

    if (!messaging && app) {
      messaging = getMessaging(app);
    }
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
      });
      return token;
    }
  } catch (error) {
    console.error("[FIREBASE] An error occurred while retrieving token. ", error);
  }
  return null;
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    isMessagingSupported().then((supported) => {
      if (supported && app) {
        if (!messaging) messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    }).catch(() => {});
  });

export { messaging };
