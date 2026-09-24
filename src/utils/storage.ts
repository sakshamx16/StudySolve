import { StudyGroup, StudyMaterial, Solution, UserProfile, SolutionReview } from '../types';
import { initialGroups, initialMaterials, initialSolutions, currentUser, GUEST_USER } from '../data/initialData';

const GROUPS_STORAGE_KEY = 'studysolve_v2_groups';
const MATERIALS_STORAGE_KEY = 'studysolve_v2_materials';
const SOLUTIONS_STORAGE_KEY = 'studysolve_v2_solutions';
const USER_STORAGE_KEY = 'studysolve_v2_user';

const LEGACY_DUMMY_GROUP_IDS = [
  'grp-accounting',
  'grp-taxation',
  'grp-economics',
  'grp-costing',
  'grp-finance',
  'grp-law'
];

export function getStoredGroups(): StudyGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any legacy dummy groups
    const sanitized = parsed.filter((g) => g && !LEGACY_DUMMY_GROUP_IDS.includes(g.id));
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.warn('Error reading groups from storage', err);
    return [];
  }
}

export function saveStoredGroups(groups: StudyGroup[]): void {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.error('Error saving groups to storage', err);
  }
}

export function getStoredMaterials(): StudyMaterial[] {
  try {
    const raw = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(initialMaterials));
      return initialMaterials;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading materials from storage, using defaults', err);
    return initialMaterials;
  }
}

export function saveStoredMaterials(materials: StudyMaterial[]): void {
  try {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
  } catch (err) {
    console.error('Error saving materials to storage', err);
  }
}

export function getStoredSolutions(): Solution[] {
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(initialSolutions));
      return initialSolutions;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading solutions from storage, using defaults', err);
    return initialSolutions;
  }
}

export function saveStoredSolutions(solutions: Solution[]): void {
  try {
    localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(solutions));
  } catch (err) {
    console.error('Error saving solutions to storage', err);
  }
}

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return GUEST_USER;
    }
    const parsed = JSON.parse(raw);
    // If previously saved mock user was Rohan Mehta, sanitize it to guest user for clean public interface
    if (parsed && (parsed.name === 'Rohan Mehta' || parsed.id === 'usr-current')) {
      localStorage.removeItem(USER_STORAGE_KEY);
      return GUEST_USER;
    }
    // If empty name or invalid object, return guest
    if (!parsed || !parsed.name) {
      return GUEST_USER;
    }
    return parsed;
  } catch (err) {
    console.warn('Error reading user from storage', err);
    return GUEST_USER;
  }
}

export function saveStoredUser(user: UserProfile): void {
  try {
    if (!user || !user.name || user.id === 'guest') {
      localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error saving user to storage', err);
  }
}

export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.warn('Error clearing stored user', err);
  }
}

export function resetToDemoData(): void {
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(initialGroups));
  localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(initialMaterials));
  localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(initialSolutions));
  localStorage.removeItem(USER_STORAGE_KEY);
}
