import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  Firestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { StudyMaterial, Solution, StudyGroup, UserProfile } from './types';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCjtZbOBkxMqZh7WHGjAjX6rimtqgbXpeo",
  authDomain: "studysolve-bdec1.firebaseapp.com",
  projectId: "studysolve-bdec1",
  storageBucket: "studysolve-bdec1.firebasestorage.app",
  messagingSenderId: "891319907963",
  appId: "1:891319907963:web:3bfd55b4a4dcd1f26814de",
  measurementId: "G-FT7RJ13JMX"
};

// Initialize Firebase only once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with browser local persistence for session continuity across tabs and restarts
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth session persistence initialization notice:', err);
});

// Suppress benign internal WebChannel reconnect stream warnings
try {
  setLogLevel('error');
} catch {
  // ignore
}

// Initialize Firestore with auto-detect long polling and undefined property skipping
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Google Auth Provider - reused singleton instance
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------

// Active in-flight sign-in lock to prevent duplicate popup triggers
let inFlightGoogleSignIn: Promise<FirebaseUser> | null = null;

export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (inFlightGoogleSignIn) {
    return inFlightGoogleSignIn;
  }

  // Trigger popup synchronously to preserve user click gesture for instant popup launch
  const signInPromise = signInWithPopup(auth, googleProvider)
    .then((result) => result.user)
    .catch((error) => {
      if (error?.code === 'auth/unauthorized-domain') {
        console.warn('Google sign-in requires domain authorization in Firebase Console for:', typeof window !== 'undefined' ? window.location.hostname : 'current domain');
      } else {
        console.error('Google sign-in error:', error);
      }
      throw error;
    })
    .finally(() => {
      inFlightGoogleSignIn = null;
    });

  inFlightGoogleSignIn = signInPromise;
  return signInPromise;
}

export async function registerWithEmail(email: string, pass: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function loginAsGuest(guestName?: string) {
  const cred = await signInAnonymously(auth);
  if (guestName?.trim()) {
    await updateProfile(cred.user, { displayName: guestName.trim() });
  }
  return cred.user;
}

export async function logOutUser() {
  return await firebaseSignOut(auth);
}

export const signOutUser = logOutUser;

// -------------------------------------------------------------
// Firestore Helpers for Real-time Multi-user Sync
// -------------------------------------------------------------

// Save/Update user profile in Cloud Firestore using authenticated user's UID as doc ID
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const targetUid = profile.authUid || (auth.currentUser ? auth.currentUser.uid : (profile.id !== 'guest' ? profile.id : null));
    if (!targetUid || targetUid === 'guest') return;

    const userRef = doc(db, 'users', targetUid);
    
    // Explicitly define document data without any undefined fields (prevents Firestore rejection)
    const dataToSave: Record<string, any> = {
      id: targetUid,
      authUid: targetUid,
      name: (profile.name || '').trim(),
      avatar: profile.avatar || '',
      gradeLevel: (profile.gradeLevel || 'Commerce Student (B.Com / CA Aspirant)').trim(),
      points: typeof profile.points === 'number' ? profile.points : 0,
      solutionsSubmitted: profile.solutionsSubmitted || 0,
      materialsShared: profile.materialsShared || 0,
      joinedGroupIds: Array.isArray(profile.joinedGroupIds) ? profile.joinedGroupIds : [],
      courses: Array.isArray(profile.courses) ? profile.courses : [],
      bio: (profile.bio || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    // Determine custom avatar flag
    const isCustom = Boolean(
      profile.hasCustomAvatar ||
      profile.customAvatar ||
      (profile.avatar && !profile.avatar.includes('googleusercontent.com'))
    );
    dataToSave.hasCustomAvatar = isCustom;

    if (isCustom) {
      dataToSave.customAvatar = profile.customAvatar || profile.avatar;
    }

    if (profile.email) {
      dataToSave.email = profile.email;
    }

    if (profile.isAnonymous !== undefined) {
      dataToSave.isAnonymous = profile.isAnonymous;
    }

    await setDoc(userRef, dataToSave, { merge: true });

    // Also update Firebase Auth local user profile so onAuthStateChanged stays in sync
    if (auth.currentUser && auth.currentUser.uid === targetUid) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: dataToSave.name,
          photoURL: dataToSave.avatar,
        });
      } catch {
        // Non-critical local auth profile notice
      }
    }
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
    throw err;
  }
}

// Fetch user profile from Firestore by UID
export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  if (!uid || uid === 'guest') return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { id: snap.id, authUid: snap.id, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes('offline') || err?.code === 'unavailable') {
      console.info('Firestore client reconnecting; active session preserved.');
    } else {
      console.warn('Could not fetch user profile from Firestore:', err);
    }
    return null;
  }
}

// Subscribe to user profile document in real-time across devices
export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!uid || uid === 'guest') {
    return () => {};
  }
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    { includeMetadataChanges: false },
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, authUid: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('User profile real-time sync notice:', err);
      if (onError) onError(err);
    }
  );
}

// Subscribe to questions / materials
export function subscribeToFirestoreMaterials(
  onData: (materials: StudyMaterial[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'materials');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: StudyMaterial[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as StudyMaterial);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      console.warn('Firestore materials subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

// Recursively strip undefined properties so setDoc never rejects documents
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = sanitizeForFirestore(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// Save or publish a question / study material
export async function addMaterialToFirestore(material: StudyMaterial): Promise<void> {
  try {
    const docRef = doc(db, 'materials', material.id);
    const sanitized = sanitizeForFirestore(material);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.info('Firestore material save notice:', err);
  }
}

// Delete question / study material (mistakenly sent or unwanted)
export async function deleteMaterialFromFirestore(materialId: string): Promise<void> {
  try {
    const docRef = doc(db, 'materials', materialId);
    await deleteDoc(docRef);
  } catch (err) {
    console.info('Firestore material delete notice:', err);
  }
}

// Subscribe to solutions
export function subscribeToFirestoreSolutions(
  onData: (solutions: Solution[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'solutions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Solution[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Solution);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      console.info('Firestore solutions subscription notice:', err);
      if (onError) onError(err);
    }
  );
}

// Save or publish a student solution
export async function addSolutionToFirestore(solution: Solution): Promise<void> {
  try {
    const docRef = doc(db, 'solutions', solution.id);
    const sanitized = sanitizeForFirestore(solution);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.info('Firestore solution save notice:', err);
  }
}

// Direct fetch of solutions from Firestore (anti-spoofing cloud verification)
export async function fetchSolutionsDirectlyFromFirestore(): Promise<Solution[]> {
  const colRef = collection(db, 'solutions');
  const snap = await getDocs(colRef);
  const items: Solution[] = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() } as Solution);
  });
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items;
}

// Direct fetch of registered users from Firestore
export async function fetchUsersDirectlyFromFirestore(): Promise<UserProfile[]> {
  const colRef = collection(db, 'users');
  const snap = await getDocs(colRef);
  const items: UserProfile[] = [];
  snap.forEach((d) => {
    items.push({ id: d.id, ...d.data() } as UserProfile);
  });
  return items;
}

// Delete solution
export async function deleteSolutionFromFirestore(solutionId: string): Promise<void> {
  try {
    const docRef = doc(db, 'solutions', solutionId);
    await deleteDoc(docRef);
  } catch (err) {
    console.info('Firestore solution delete notice:', err);
  }
}

// Subscribe to study groups
export function subscribeToFirestoreGroups(
  onData: (groups: StudyGroup[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'study_groups');
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        return;
      }
      const items: StudyGroup[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as StudyGroup);
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (err) => {
      console.info('Firestore groups subscription notice:', err);
      if (onError) onError(err);
    }
  );
}

// Save or create a study group
export async function addGroupToFirestore(group: StudyGroup): Promise<void> {
  try {
    const docRef = doc(db, 'study_groups', group.id);
    const sanitized = sanitizeForFirestore(group);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.info('Firestore group save notice:', err);
  }
}

// Delete study group from Firestore
export async function deleteGroupFromFirestore(groupId: string): Promise<void> {
  try {
    const docRef = doc(db, 'study_groups', groupId);
    await deleteDoc(docRef);
  } catch (err) {
    console.info('Firestore group delete notice:', err);
  }
}

