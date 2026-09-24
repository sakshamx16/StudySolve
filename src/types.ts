export type StandardSubject =
  | 'Financial Accounting'
  | 'Cost & Management Accounting'
  | 'Economics'
  | 'Taxation & GST'
  | 'Business Studies & Management'
  | 'Corporate & Business Law'
  | 'Financial Management & Investment'
  | 'Business Mathematics & Statistics'
  | 'Auditing & Assurance';

export type Subject = StandardSubject | (string & {});

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type SolutionMediaType = 'pdf' | 'image' | 'video';

export interface StudyGroup {
  id: string;
  name: string;
  subject: Subject;
  description: string;
  memberCount: number;
  materialsCount: number;
  badgeEmoji: string;
  accentColor: string;
  isJoined: boolean;
  meetingFrequency?: string;
  leaderName: string;
  createdByUid?: string;
  createdAt: string;
}

export interface MaterialAttachment {
  type: 'pdf' | 'image' | 'text';
  name: string;
  size?: string;
  url?: string;
  contentPreview?: string;
}

export interface StudyMaterial {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  subject: Subject;
  topic: string;
  difficulty: DifficultyLevel;
  description: string;
  problemStatement: string;
  author: {
    name: string;
    avatar: string;
    role?: string;
    uid?: string;
  };
  authorUid?: string;
  attachment?: MaterialAttachment;
  createdAt: string;
  dueDate?: string;
  tags: string[];
  solutionsCount: number;
  averageRating: number;
  isSolved: boolean;
  bookmarked?: boolean;
}

export interface SolutionReview {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorUid?: string;
  rating: number; // 1 to 5
  criteria: {
    clarity: number; // 1-5
    accuracy: number; // 1-5
    stepByStep: number; // 1-5
  };
  feedbackText: string;
  helpfulTags: string[];
  createdAt: string;
  likes: number;
  hasLiked?: boolean;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  formulaOrSnippet?: string;
}

export interface VideoTimestamp {
  timeInSeconds: number;
  timeDisplay: string;
  label: string;
}

export interface Solution {
  id: string;
  materialId: string;
  materialTitle: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    gradeLevel?: string;
    reputation: number;
    badge?: string;
    uid?: string;
  };
  authorUid?: string;
  solutionType: SolutionMediaType;
  mediaUrl: string;
  fileName?: string;
  fileSize?: string;
  pageCount?: number;
  pdfPages?: string[]; // preview lines or image simulation
  videoDuration?: string;
  videoEmbedUrl?: string;
  videoTimestamps?: VideoTimestamp[];
  imageCaption?: string;
  steps: SolutionStep[];
  keyTakeaway: string;
  toolsUsed: string[]; // e.g. "GoodNotes iPad", "LaTeX", "Loom Video", "Pen & Paper"
  createdAt: string;
  averageRating: number;
  ratingsCount: number;
  criteriaBreakdown: {
    clarity: number;
    accuracy: number;
    stepByStep: number;
  };
  reviews: SolutionReview[];
  isVerified: boolean;
  helpfulVotes: number;
  hasVotedHelpful?: boolean;
  userRating?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  gradeLevel: string;
  email?: string;
  authUid?: string;
  isAnonymous?: boolean;
  courses?: string[];
  bio?: string;
  points: number;
  solutionsSubmitted: number;
  materialsShared: number;
  joinedGroupIds: string[];
}
