// Firebase設定 - 本番環境用（設定値を差し替えてください）
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const VAPID_KEY = process.env.REACT_APP_VAPID_KEY || "YOUR_VAPID_KEY";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

// FCMトークン取得
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await setDoc(doc(db, 'fcm_tokens', token), {
        token,
        createdAt: serverTimestamp()
      });
      return token;
    }
  } catch (err) {
    console.error('FCMトークン取得失敗:', err);
  }
  return null;
};

// ニュース取得
export const getNews = (callback) => {
  const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(news);
  });
};

// ニュース投稿
export const addNews = async (data) => {
  return await addDoc(collection(db, 'news'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// チャット投稿
export const addChat = async (data) => {
  return await addDoc(collection(db, 'chats'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// セミナー申込
export const addSeminarEntry = async (data) => {
  return await addDoc(collection(db, 'seminar_entries'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// 相談予約
export const addConsultation = async (data) => {
  return await addDoc(collection(db, 'consultations'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export { collection, getDocs, query, orderBy, onSnapshot };
