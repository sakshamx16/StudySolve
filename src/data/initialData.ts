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

export const initialGroups: StudyGroup[] = [
  {
    id: 'grp-accounting',
    name: 'Financial Accounting & Balance Sheet Hub',
    subject: 'Financial Accounting',
    description: 'Ledger reconciliations, company final accounts, cash flow statements, and balance sheet adjustments.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '📊',
    accentColor: '#2563eb',
    isJoined: true,
    meetingFrequency: 'Mondays & Thursdays, 6 PM',
    leaderName: 'Peer Mentor (Faculty Lead)',
    createdAt: '2026-09-20',
  },
  {
    id: 'grp-taxation',
    name: 'Direct & Indirect Taxation (GST / IT)',
    subject: 'Taxation & GST',
    description: 'Income heads, capital gains, corporate tax deductions, and GST input tax credit (ITC) calculations.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '⚖️',
    accentColor: '#d97706',
    isJoined: true,
    meetingFrequency: 'Tuesdays, 7 PM',
    leaderName: 'Amit Verma',
    createdAt: '2026-09-20',
  },
  {
    id: 'grp-economics',
    name: 'Micro & Macroeconomics Forum',
    subject: 'Economics',
    description: 'Consumer equilibrium, demand elasticity, national income aggregates, and fiscal/monetary policies.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '📈',
    accentColor: '#7c3aed',
    isJoined: true,
    meetingFrequency: 'Saturdays, 11 AM',
    leaderName: 'Ananya Sharma',
    createdAt: '2026-09-20',
  },
  {
    id: 'grp-costing',
    name: 'Cost & Management Accounting Circle',
    subject: 'Cost & Management Accounting',
    description: 'Process costing, marginal costing, variance analysis, and break-even point (BEP) problem solving.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '📑',
    accentColor: '#059669',
    isJoined: false,
    meetingFrequency: 'Wednesdays, 5 PM',
    leaderName: 'Pooja Singhal',
    createdAt: '2026-09-20',
  },
  {
    id: 'grp-finance',
    name: 'Corporate Finance & Valuation Lab',
    subject: 'Financial Management & Investment',
    description: 'Capital budgeting (NPV & IRR), working capital management, WACC, and financial statement ratio analysis.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '💰',
    accentColor: '#0284c7',
    isJoined: false,
    meetingFrequency: 'Sundays, 4 PM',
    leaderName: 'Neha Kapoor',
    createdAt: '2026-09-20',
  },
  {
    id: 'grp-law',
    name: 'Corporate & Business Law Study Group',
    subject: 'Corporate & Business Law',
    description: 'Companies Act provisions, board meetings, director duties, contract disputes, and legal case studies.',
    memberCount: 1,
    materialsCount: 0,
    badgeEmoji: '🏛️',
    accentColor: '#e11d48',
    isJoined: false,
    meetingFrequency: 'Fridays, 6 PM',
    leaderName: 'Vikram Joshi',
    createdAt: '2026-09-20',
  },
];

// Completely clean starting state
// No pre-populated questions or solutions so user can upload the first question!
export const initialMaterials: StudyMaterial[] = [];

export const initialSolutions: Solution[] = [];

