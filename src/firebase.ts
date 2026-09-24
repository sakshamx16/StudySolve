import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
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

// Initialize Firebase with config
export const app = initializeApp(firebaseConfig);

// Initialize Auth with browser local persistence for session continuity across tabs and restarts
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth session persistence initialization notice:', err);
});

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider - reused singleton instance
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// -------------------------------------------------------------
// Authentication Helpers
// -------------------------------------------------------------

// Active in-flight sign-in lock to prevent duplicate popup triggers and race conditions
let inFlightGoogleSignIn: Promise<FirebaseUser> | null = null;

export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (inFlightGoogleSignIn) {
    return inFlightGoogleSignIn;
  }

  inFlightGoogleSignIn = (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      inFlightGoogleSignIn = null;
    }
  })();

  return inFlightGoogleSignIn;
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
    const dataToSave: Partial<UserProfile> & { updatedAt: string } = {
      ...profile,
      id: targetUid,
      authUid: targetUid,
      updatedAt: new Date().toISOString(),
    };

    // If user has a custom website avatar, preserve it
    if (profile.avatar && !profile.avatar.includes('googleusercontent.com')) {
      dataToSave.hasCustomAvatar = true;
      dataToSave.customAvatar = profile.avatar;
    }

    await setDoc(userRef, dataToSave, { merge: true });
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
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
    return null;
  }
}

// Subscribe to user profile document in real-time across devices
export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!uid || uid === 'guest') {
    return () => {};
  }
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, authUid: snapshot.id, ...snapshot.data() } as UserProfile);
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

// Save or publish a question / study material
export async function addMaterialToFirestore(material: StudyMaterial): Promise<void> {
  const docRef = doc(db, 'materials', material.id);
  await setDoc(docRef, material);
}

// Delete question / study material (mistakenly sent or unwanted)
export async function deleteMaterialFromFirestore(materialId: string): Promise<void> {
  const docRef = doc(db, 'materials', materialId);
  await deleteDoc(docRef);
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
      console.warn('Firestore solutions subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

// Save or publish a student solution
export async function addSolutionToFirestore(solution: Solution): Promise<void> {
  const docRef = doc(db, 'solutions', solution.id);
  await setDoc(docRef, solution);
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
  const docRef = doc(db, 'solutions', solutionId);
  await deleteDoc(docRef);
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
        onData([]);
        return;
      }
      const items: StudyGroup[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as StudyGroup);
      });
      onData(items);
    },
    (err) => {
      console.warn('Firestore groups subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

// Save or create a study group
export async function addGroupToFirestore(group: StudyGroup): Promise<void> {
  const docRef = doc(db, 'study_groups', group.id);
  await setDoc(docRef, group);
}

// Delete study group from Firestore
export async function deleteGroupFromFirestore(groupId: string): Promise<void> {
  const docRef = doc(db, 'study_groups', groupId);
  await deleteDoc(docRef);
}

