import { StudyGroup, StudyMaterial, Solution, UserProfile, SolutionReview, GroupMessage } from '../types';
import { initialGroups, initialMaterials, initialSolutions, currentUser, GUEST_USER } from '../data/initialData';

const GROUPS_STORAGE_KEY = 'studysolve_v2_groups';
const MATERIALS_STORAGE_KEY = 'studysolve_v2_materials';
const SOLUTIONS_STORAGE_KEY = 'studysolve_v2_solutions';
const USER_STORAGE_KEY = 'studysolve_v2_user';
const JOINED_GROUPS_STORAGE_KEY = 'studysolve_joined_group_ids';
const CREATED_GROUPS_STORAGE_KEY = 'studysolve_created_group_ids';
const CLIENT_UID_KEY = 'studysolve_client_device_uid';
const GROUP_MESSAGES_PREFIX = 'studysolve_group_messages_';

export function getOrCreateClientUid(): string {
  try {
    let uid = localStorage.getItem(CLIENT_UID_KEY);
    if (!uid) {
      uid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(CLIENT_UID_KEY, uid);
    }
    return uid;
  } catch {
    return `usr_${Date.now()}`;
  }
}

export function getStoredCreatedGroupIds(): string[] {
  try {
    const raw = localStorage.getItem(CREATED_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function addStoredCreatedGroupId(groupId: string): void {
  if (!groupId) return;
  try {
    const current = getStoredCreatedGroupIds();
    if (!current.includes(groupId)) {
      localStorage.setItem(CREATED_GROUPS_STORAGE_KEY, JSON.stringify([...current, groupId]));
    }
  } catch {}
}

export function isRealGroupHost(
  group: StudyGroup | null | undefined, 
  user: UserProfile | null | undefined
): boolean {
  if (!group || !user) return false;

  const createdByUid = (group.createdByUid || '').trim();
  const createdGroupIds = getStoredCreatedGroupIds();

  // 1. Check if this client browser session explicitly created this circle
  const isCreatedOnThisDevice = createdGroupIds.includes(group.id);
  if (isCreatedOnThisDevice) {
    return true;
  }

  const authUid = (user.authUid || '').trim();
  const currentId = (user.id || '').trim();
  const userEmail = (user.email || '').trim().toLowerCase();
  const clientUid = getOrCreateClientUid();

  // 2. Strict UID match against non-generic UID
  if (createdByUid && createdByUid !== 'guest' && createdByUid !== 'anonymous') {
    if (authUid && createdByUid === authUid) return true;
    if (currentId && currentId !== 'guest' && createdByUid === currentId) return true;
    if (userEmail && createdByUid.toLowerCase() === userEmail) return true;
    if (clientUid && createdByUid === clientUid) return true;
  }

  // Any other user who joined the circle is NOT the host
  return false;
}

export function getStoredGroupMessages(groupId: string): GroupMessage[] {
  try {
    const raw = localStorage.getItem(`${GROUP_MESSAGES_PREFIX}${groupId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredGroupMessages(groupId: string, messages: GroupMessage[]): void {
  try {
    localStorage.setItem(`${GROUP_MESSAGES_PREFIX}${groupId}`, JSON.stringify(messages.slice(-300)));
  } catch {}
}

export async function fetchGroupMessagesFromApi(groupId: string): Promise<GroupMessage[]> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/messages`);
    if (!res.ok) return getStoredGroupMessages(groupId);
    const data = await res.json();
    if (Array.isArray(data.messages)) {
      saveStoredGroupMessages(groupId, data.messages);
      return data.messages;
    }
  } catch {}
  return getStoredGroupMessages(groupId);
}

export async function sendGroupMessageToApi(message: GroupMessage): Promise<void> {
  try {
    await fetch(`/api/groups/${encodeURIComponent(message.groupId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  } catch {}
}

export function getStoredJoinedGroupIds(): string[] {
  try {
    const raw = localStorage.getItem(JOINED_GROUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveStoredJoinedGroupIds(ids: string[]): void {
  try {
    localStorage.setItem(JOINED_GROUPS_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

export function addStoredJoinedGroupId(groupId: string): void {
  if (!groupId) return;
  const current = getStoredJoinedGroupIds();
  if (!current.includes(groupId)) {
    saveStoredJoinedGroupIds([...current, groupId]);
  }
}

export function removeStoredJoinedGroupId(groupId: string): void {
  if (!groupId) return;
  const current = getStoredJoinedGroupIds();
  saveStoredJoinedGroupIds(current.filter((id) => id !== groupId));
}

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

const DELETED_MATERIALS_KEY = 'studysolve_deleted_materials';

export function getStoredDeletedMaterialIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_MATERIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStoredDeletedMaterialId(materialId: string): void {
  try {
    const ids = getStoredDeletedMaterialIds();
    if (!ids.includes(materialId)) {
      ids.push(materialId);
      localStorage.setItem(DELETED_MATERIALS_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

export function getStoredMaterials(): StudyMaterial[] {
  try {
    const deletedIds = new Set(getStoredDeletedMaterialIds());
    const raw = localStorage.getItem(MATERIALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(initialMaterials));
      return initialMaterials.filter((m) => !deletedIds.has(m.id));
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((m: StudyMaterial) => !deletedIds.has(m.id)) : [];
  } catch (err) {
    console.warn('Error reading materials from storage, using defaults', err);
    return initialMaterials;
  }
}

export function saveStoredMaterials(materials: StudyMaterial[]): void {
  try {
    const deletedIds = new Set(getStoredDeletedMaterialIds());
    const filtered = materials.filter((m) => !deletedIds.has(m.id));
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(filtered));
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
    if (!user || !user.name) {
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
      // NOTE: Do not overwrite local storage directly with raw server groups,
      // as mergeIncomingGroups preserves client-specific isJoined states and local memberships.
      return data.groups;
    }
  } catch {
    // Graceful silent fallback to local storage
  }
  return getStoredGroups();
}

export async function lookupSharedGroupFromApi(
  code?: string,
  token?: string,
  groupId?: string
): Promise<StudyGroup | null> {
  try {
    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (token) params.set('token', token);
    if (groupId) params.set('groupId', groupId);
    const res = await fetch(`/api/groups/lookup?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.group) {
        return data.group as StudyGroup;
      }
    }
  } catch {
    // Graceful silent fallback
  }
  return null;
}

export async function saveSharedGroupToApi(group: StudyGroup): Promise<void> {
  try {
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group }),
    });
  } catch {
    // Silent catch
  }
}

export async function deleteSharedGroupFromApi(groupId: string, userId?: string): Promise<void> {
  try {
    await fetch(`/api/groups/${groupId}`, { 
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {})
      },
      body: JSON.stringify({ userId })
    });
  } catch {
    // Silent catch
  }
}

export async function toggleJoinSharedGroupInApi(
  groupId: string, 
  userId: string, 
  isJoining: boolean,
  userIds?: string[]
): Promise<StudyGroup | null> {
  try {
    const res = await fetch(`/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isJoining, userIds }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.group;
    }
  } catch {
    // Silent catch
  }
  return null;
}

export async function saveUserProfileToApi(profile: UserProfile): Promise<void> {
  try {
    if (!profile || (!profile.id && !profile.authUid)) return;
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
  } catch {
    // Silent catch
  }
}

export async function fetchUserProfileFromApi(uid: string): Promise<UserProfile | null> {
  try {
    if (!uid || uid === 'guest') return null;
    const res = await fetch(`/api/users/${uid}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.profile) {
        return data.profile;
      }
    }
  } catch {
    // Silent catch
  }
  return null;
}

export async function fetchSharedMaterialsFromApi(): Promise<StudyMaterial[]> {
  try {
    const deletedIds = new Set(getStoredDeletedMaterialIds());
    const res = await fetch('/api/materials');
    if (!res.ok) return getStoredMaterials();
    const data = await res.json();
    if (Array.isArray(data.materials)) {
      const filtered = data.materials.filter((m: StudyMaterial) => !deletedIds.has(m.id));
      saveStoredMaterials(filtered);
      return filtered;
    }
  } catch {
    // Silent catch
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
  } catch {
    // Silent catch
  }
}

export async function deleteSharedMaterialFromApi(materialId: string): Promise<void> {
  addStoredDeletedMaterialId(materialId);
  const current = getStoredMaterials().filter((m) => m.id !== materialId);
  saveStoredMaterials(current);
  try {
    await fetch(`/api/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' });
  } catch {
    // Silent catch
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
  } catch {
    // Silent catch
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
  } catch {
    // Silent catch
  }
}

export async function deleteSharedSolutionFromApi(solutionId: string): Promise<void> {
  try {
    await fetch(`/api/solutions/${solutionId}`, { method: 'DELETE' });
  } catch {
    // Silent catch
  }
}

