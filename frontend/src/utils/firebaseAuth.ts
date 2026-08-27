import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';
import { UserProfile, StudyGoal, DailyTimeBudget, PreferredStudyTime, PrioritySkill } from '../types';

// Initialize Firebase App & Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

const LOCAL_USER_PROFILE_KEY = 'ielts_master_user_profile_cache_v3';

export const DEFAULT_ANONYMOUS_PROFILE: UserProfile = {
  uid: 'guest_user_default',
  email: 'guest@ieltsmaster.ai',
  displayName: 'IELTS Scholar',
  avatarSeed: 'adventurer_scholar',
  currentBand: 6.0,
  targetBand: 7.5,
  targetExamDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ahead
  studyGoal: 'study_abroad',
  goalDescription: 'Đạt target 7.5+ để nộp hồ sơ du học và học bổng quốc tế',
  dailyBudgetMinutes: 30,
  preferredStudyTime: 'evening',
  interestedTopics: [
    'Môi trường & Biến đổi khí hậu',
    'Giáo dục & Học thuật',
    'Khoa học & Công nghệ AI',
    'Xã hội & Đời sống hiện đại',
  ],
  prioritySkills: ['vocabulary_srs', 'speaking_part1_2_3', 'band_booster'],
  unlockedBadges: ['first_step', 'speaking_novice'],
  experiencePoints: 320,
  level: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/**
 * Load cached user profile from localStorage for a specific userId
 */
export function getLocalCachedProfile(userId: string = 'guest'): UserProfile {
  try {
    const raw = localStorage.getItem(`${LOCAL_USER_PROFILE_KEY}_${userId}`);
    if (raw) {
      return { ...DEFAULT_ANONYMOUS_PROFILE, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...DEFAULT_ANONYMOUS_PROFILE, uid: userId };
}

/**
 * Save user profile to local cache for a specific userId
 */
export function saveLocalCachedProfile(profile: UserProfile): void {
  try {
    const userId = profile.uid || 'guest';
    localStorage.setItem(`${LOCAL_USER_PROFILE_KEY}_${userId}`, JSON.stringify(profile));
  } catch {}
}

/**
 * Fetch profile from Firestore
 */
export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      saveLocalCachedProfile(data);
      return data;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch user profile from Firestore:', err);
    return getLocalCachedProfile(uid);
  }
}

/**
 * Save profile to Firestore and local storage
 */
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<boolean> {
  const updatedProfile: UserProfile = {
    ...profile,
    updatedAt: Date.now(),
  };

  saveLocalCachedProfile(updatedProfile);

  try {
    if (profile.uid && !profile.uid.startsWith('guest_')) {
      const userDocRef = doc(db, 'users', profile.uid);
      await setDoc(userDocRef, updatedProfile, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn('Error saving user profile to Firestore:', err);
    return false;
  }
}

/**
 * Create new profile for a newly signed up user
 */
export async function createInitialUserProfile(
  user: FirebaseUser,
  customData?: Partial<UserProfile>
): Promise<UserProfile> {
  const newProfile: UserProfile = {
    ...DEFAULT_ANONYMOUS_PROFILE,
    uid: user.uid,
    email: user.email || 'user@ieltsmaster.ai',
    displayName: user.displayName || user.email?.split('@')[0] || 'IELTS Scholar',
    photoURL: user.photoURL || undefined,
    avatarSeed: user.uid.slice(0, 8),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...customData,
  };

  await syncUserProfileToFirestore(newProfile);
  return newProfile;
}

/**
 * Sign up with Email and Password
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  additionalData?: Partial<UserProfile>
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  const profile = await createInitialUserProfile(cred.user, {
    displayName,
    email,
    ...additionalData,
  });

  return { user: cred.user, profile };
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  let profile = await fetchUserProfileFromFirestore(cred.user.uid);
  if (!profile) {
    profile = await createInitialUserProfile(cred.user);
  }
  return { user: cred.user, profile };
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  let profile = await fetchUserProfileFromFirestore(cred.user.uid);
  if (!profile) {
    profile = await createInitialUserProfile(cred.user, {
      displayName: cred.user.displayName || 'Google Scholar',
      email: cred.user.email || '',
      photoURL: cred.user.photoURL || undefined,
    });
  }
  return { user: cred.user, profile };
}

/**
 * Sign in as Guest / Anonymous Demo
 */
export async function loginAsGuest(guestName?: string): Promise<{ profile: UserProfile }> {
  try {
    const cred = await signInAnonymously(auth);
    const guestProfile: UserProfile = {
      ...DEFAULT_ANONYMOUS_PROFILE,
      uid: cred.user.uid,
      displayName: guestName || 'Khách Trải Nghiệm',
      email: 'guest@ieltsmaster.ai',
      updatedAt: Date.now(),
    };
    await syncUserProfileToFirestore(guestProfile);
    return { profile: guestProfile };
  } catch {
    const cached = getLocalCachedProfile();
    return { profile: cached };
  }
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
