import { StudyGroup, StudyMaterial, Solution, UserProfile } from '../types';

export const GUEST_USER: UserProfile = {
  id: 'guest',
  name: '',
  avatar: '',
  gradeLevel: 'Student Scholar',
  courses: ['Financial Accounting', 'Corporate Law', 'Direct Taxation', 'Macroeconomics'],
  bio: '',
  points: 0,
  solutionsSubmitted: 0,
  materialsShared: 0,
  joinedGroupIds: [],
  isAnonymous: true,
};

export const currentUser: UserProfile = GUEST_USER;

// Completely clean starting state - no dummy or pre-populated groups
// Real students and peers create their own dedicated study circles
export const initialGroups: StudyGroup[] = [];

// Completely clean starting state
// No pre-populated questions or solutions so user can upload the first question!
export const initialMaterials: StudyMaterial[] = [];

export const initialSolutions: Solution[] = [];


