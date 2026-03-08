// Firebase - dripro
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA6IxElYpr3H3i4to38XxYPK6njapXxZ84",
  authDomain: "dripro-bfc0f.firebaseapp.com",
  projectId: "dripro-bfc0f",
  storageBucket: "dripro-bfc0f.firebasestorage.app",
  messagingSenderId: "510245379594",
  appId: "1:510245379594:web:cf6e18de231e21daae89f3",
  measurementId: "G-BSXVWFNS8X",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: process.env.REACT_APP_VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'fcm_tokens', token), { token, createdAt: serverTimestamp() });
      return token;
    }
  } catch (err) { console.error('FCM:', err); }
  return null;
};

export const getNews = (cb) => {
  const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addNews = async (data) => addDoc(collection(db, 'news'), { ...data, createdAt: serverTimestamp() });
export const addChat = async (data) => addDoc(collection(db, 'chats'), { ...data, createdAt: serverTimestamp() });
export const addSeminarEntry = async (data) => addDoc(collection(db, 'seminar_entries'), { ...data, createdAt: serverTimestamp() });
export const addConsultation = async (data) => addDoc(collection(db, 'consultations'), { ...data, createdAt: serverTimestamp() });
export { collection, getDocs, query, orderBy, onSnapshot };
