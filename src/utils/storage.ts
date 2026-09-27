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

const ACCOUNT_USER_PREFIX = 'studysolve_user_';

export function getStoredUser(accountKey?: string): UserProfile {
  try {
    // 1. If an accountKey (UID or email) is provided, check account-specific cache first
    if (accountKey && accountKey !== 'guest') {
      const sanitizedKey = accountKey.toLowerCase().trim();
      const directKey = `${ACCOUNT_USER_PREFIX}${sanitizedKey}`;
      const directRaw = localStorage.getItem(directKey) || localStorage.getItem(`${ACCOUNT_USER_PREFIX}${accountKey}`);
      if (directRaw) {
        const parsed = JSON.parse(directRaw);
        if (parsed && parsed.name && parsed.id !== 'guest') {
          return parsed;
        }
      }

      // Check all cached accounts for matching id, authUid, or email
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ACCOUNT_USER_PREFIX)) {
          try {
            const rawVal = localStorage.getItem(key);
            if (rawVal) {
              const u = JSON.parse(rawVal);
              if (
                u &&
                u.name &&
                (u.id === accountKey ||
                 u.authUid === accountKey ||
                 (u.email && u.email.toLowerCase().trim() === sanitizedKey))
              ) {
                return u;
              }
            }
          } catch {
            // ignore JSON parse error for corrupt item
          }
        }
      }
    }

    // 2. Fall back to current active session storage
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

    // If an accountKey was provided and active session doesn't match it, don't use wrong user
    if (accountKey && accountKey !== 'guest') {
      const match = parsed.id === accountKey || parsed.authUid === accountKey || (parsed.email && parsed.email.toLowerCase().trim() === accountKey.toLowerCase().trim());
      if (!match) {
        return GUEST_USER;
      }
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
      return;
    }

    const serialized = JSON.stringify(user);

    // Save as current active session
    localStorage.setItem(USER_STORAGE_KEY, serialized);

    // Save under user UID
    if (user.id && user.id !== 'guest') {
      localStorage.setItem(`${ACCOUNT_USER_PREFIX}${user.id}`, serialized);
    }
    if (user.authUid && user.authUid !== 'guest' && user.authUid !== user.id) {
      localStorage.setItem(`${ACCOUNT_USER_PREFIX}${user.authUid}`, serialized);
    }

    // Save under user email
    if (user.email && user.email.trim()) {
      localStorage.setItem(`${ACCOUNT_USER_PREFIX}${user.email.toLowerCase().trim()}`, serialized);
    }
  } catch (err) {
    console.error('Error saving user to storage', err);
  }
}

export function clearStoredUser(): void {
  try {
    // Only clears active session pointer; keeps account backups so logging back into the same account recovers profile
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

// -------------------------------------------------------------
// Cross-Account Server Synchronizers
// -------------------------------------------------------------

export async function fetchSharedGroupsFromApi(): Promise<StudyGroup[]> {
  try {
    const res = await fetch('/api/groups');
    if (!res.ok) return getStoredGroups();
    const data = await res.json();
    if (Array.isArray(data.groups)) {
      saveStoredGroups(data.groups);
      return data.groups;
    }
  } catch (err) {
    console.warn('Notice loading groups from server:', err);
  }
  return getStoredGroups();
}

export async function saveSharedGroupToApi(group: StudyGroup): Promise<void> {
  try {
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group }),
    });
  } catch (err) {
    console.warn('Notice saving group to server:', err);
  }
}

export async function deleteSharedGroupFromApi(groupId: string): Promise<void> {
  try {
    await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Notice deleting group from server:', err);
  }
}

export async function toggleJoinSharedGroupInApi(
  groupId: string, 
  userId: string, 
  isJoining: boolean
): Promise<StudyGroup | null> {
  try {
    const res = await fetch(`/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isJoining }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.group;
    }
  } catch (err) {
    console.warn('Notice updating group membership in server:', err);
  }
  return null;
}

export async function fetchSharedMaterialsFromApi(): Promise<StudyMaterial[]> {
  try {
    const res = await fetch('/api/materials');
    if (!res.ok) return getStoredMaterials();
    const data = await res.json();
    if (Array.isArray(data.materials)) {
      saveStoredMaterials(data.materials);
      return data.materials;
    }
  } catch (err) {
    console.warn('Notice loading materials from server:', err);
  }
  return getStoredMaterials();
}

export async function saveSharedMaterialToApi(material: StudyMaterial): Promise<void> {
  try {
    await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material }),
    });
  } catch (err) {
    console.warn('Notice saving material to server:', err);
  }
}

export async function deleteSharedMaterialFromApi(materialId: string): Promise<void> {
  try {
    await fetch(`/api/materials/${materialId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Notice deleting material from server:', err);
  }
}

export async function fetchSharedSolutionsFromApi(): Promise<Solution[]> {
  try {
    const res = await fetch('/api/solutions');
    if (!res.ok) return getStoredSolutions();
    const data = await res.json();
    if (Array.isArray(data.solutions)) {
      saveStoredSolutions(data.solutions);
      return data.solutions;
    }
  } catch (err) {
    console.warn('Notice loading solutions from server:', err);
  }
  return getStoredSolutions();
}

export async function saveSharedSolutionToApi(solution: Solution): Promise<void> {
  try {
    await fetch('/api/solutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solution }),
    });
  } catch (err) {
    console.warn('Notice saving solution to server:', err);
  }
}

export async function deleteSharedSolutionFromApi(solutionId: string): Promise<void> {
  try {
    await fetch(`/api/solutions/${solutionId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Notice deleting solution from server:', err);
  }
}

