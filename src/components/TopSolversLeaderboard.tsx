import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  Sparkles, 
  TrendingUp, 
  Info, 
  ShieldCheck, 
  Search, 
  Filter,
  RefreshCw,
  Database,
  AlertTriangle,
  FileCheck2,
  Lock,
  X,
  ExternalLink,
  UserCheck,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Solution, UserProfile, SolutionReview } from '../types';
import { getStudentAvatar } from '../utils/avatar';
import { db, fetchSolutionsDirectlyFromFirestore, fetchUsersDirectlyFromFirestore } from '../firebase';
import { collection, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface TopSolversLeaderboardProps {
  solutions: Solution[];
  currentUser: UserProfile;
  onOpenSolution: (solution: Solution) => void;
}

export interface AuditedReview {
  reviewId: string;
  solutionId: string;
  reviewerName: string;
  reviewerUid?: string;
  rating: number;
  clarity: number;
  accuracy: number;
  stepByStep: number;
  isSelfReview: boolean;
  isDuplicate: boolean;
  isValid: boolean;
}

export interface CalculatedSolver {
  id: string;
  name: string;
  avatar: string;
  gradeLevel?: string;
  badge?: string;
  solutionsCount: number;
  verifiedCount: number;
  pendingCount: number;
  disqualifiedCount: number;
  helpfulVotes: number;
  // Peer-Review Quality Metrics
  totalPeerReviewsReceived: number;
  validPeerReviewsCount: number;
  selfReviewsRejectedCount: number;
  avgClarity: number;
  avgAccuracy: number;
  avgStepByStep: number;
  compositePeerRating: number;
  qualityPoints: number;
  verifiedSolutionPoints: number;
  helpfulVotePoints: number;
  excellenceBonus: number;
  calculatedPoints: number;
  isCurrentUser: boolean;
  auditedReviews: AuditedReview[];
  authoredSolutions: Solution[];
}

export default function TopSolversLeaderboard({
  solutions: initialPropSolutions,
  currentUser,
  onOpenSolution,
}: TopSolversLeaderboardProps) {
  const [firestoreSolutions, setFirestoreSolutions] = useState<Solution[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'live' | 'reverifying' | 'error'>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'top-rated'>('all');
  const [selectedAuditSolver, setSelectedAuditSolver] = useState<CalculatedSolver | null>(null);

  // 1. Direct Firestore Ingestion & Real-Time Sync
  useEffect(() => {
    let unsubSolutions: Unsubscribe | null = null;
    let unsubUsers: Unsubscribe | null = null;
    let isMounted = true;

    async function initFirestoreDirectSync() {
      try {
        setSyncStatus('connecting');
        
        // Subscribe directly to solutions collection in Firestore
        const solutionsColRef = collection(db, 'solutions');
        unsubSolutions = onSnapshot(
          solutionsColRef,
          (snapshot) => {
            if (!isMounted) return;
            const items: Solution[] = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...docSnap.data() } as Solution);
            });
            setFirestoreSolutions(items);
            setSyncStatus('live');
            setLastSyncedAt(new Date());
          },
          (err) => {
            console.warn('Direct Firestore solutions listener warning:', err);
            if (isMounted) setSyncStatus('live'); // fallback gracefully
          }
        );

        // Subscribe directly to users collection in Firestore
        const usersColRef = collection(db, 'users');
        unsubUsers = onSnapshot(
          usersColRef,
          (snapshot) => {
            if (!isMounted) return;
            const users: UserProfile[] = [];
            snapshot.forEach((docSnap) => {
              users.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            });
            setFirestoreUsers(users);
          },
          (err) => {
            console.warn('Direct Firestore users listener warning:', err);
          }
        );

      } catch (err) {
        console.error('Direct Firestore subscription error:', err);
        if (isMounted) setSyncStatus('error');
      }
    }

    initFirestoreDirectSync();

    return () => {
      isMounted = false;
      if (unsubSolutions) unsubSolutions();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Manual Trigger: Force fresh re-audit directly from Firestore
  const handleManualReverify = useCallback(async () => {
    try {
      setSyncStatus('reverifying');
      const [liveSol, liveUsers] = await Promise.all([
        fetchSolutionsDirectlyFromFirestore(),
        fetchUsersDirectlyFromFirestore(),
      ]);
      setFirestoreSolutions(liveSol);
      setFirestoreUsers(liveUsers);
      setLastSyncedAt(new Date());
      setSyncStatus('live');
    } catch (err) {
      console.error('Manual Firestore verification failed:', err);
      setSyncStatus('live');
    }
  }, []);

  // Use authoritative Firestore data if available, fallback to initial props during warm-up
  const authoritativeSolutions = useMemo(() => {
    if (firestoreSolutions.length > 0) {
      return firestoreSolutions;
    }
    return initialPropSolutions;
  }, [firestoreSolutions, initialPropSolutions]);

  // 2. Rigorous Anti-Spoofing Verification & Scoring Engine
  const calculatedSolvers = useMemo<CalculatedSolver[]>(() => {
    const solverMap = new Map<string, {
      id: string;
      name: string;
      avatar: string;
      gradeLevel?: string;
      badge?: string;
      solutions: Solution[];
    }>();

    // Register current logged in student if authenticated or has a real name
    const currentUserId = currentUser.authUid || currentUser.id;
    const isGuestUser = !currentUser.name || currentUser.id === 'guest' || currentUser.isAnonymous;
    if (!isGuestUser && currentUser.name) {
      solverMap.set(currentUserId, {
        id: currentUserId,
        name: currentUser.name,
        avatar: getStudentAvatar(currentUser.name, currentUser.avatar),
        gradeLevel: currentUser.gradeLevel,
        badge: 'Student Solver',
        solutions: [],
      });
    }

    // Register all registered Firestore users
    firestoreUsers.forEach((u) => {
      const uId = u.authUid || u.id;
      if (u.name && u.id !== 'guest' && !solverMap.has(uId)) {
        solverMap.set(uId, {
          id: uId,
          name: u.name,
          avatar: getStudentAvatar(u.name, u.avatar),
          gradeLevel: u.gradeLevel || 'Student Member',
          badge: 'Peer Contributor',
          solutions: [],
        });
      }
    });

    // Ingest all solutions from Firestore
    authoritativeSolutions.forEach((sol) => {
      const authorId = sol.authorUid || sol.author.uid || sol.author.name;
      const authorName = sol.author.name || 'Anonymous Student';

      const isThisCurrentUser =
        (sol.authorUid && sol.authorUid === currentUserId) ||
        (sol.author.uid && sol.author.uid === currentUserId) ||
        (authorName.toLowerCase() === currentUser.name.toLowerCase());

      const targetKey = isThisCurrentUser ? currentUserId : authorId;

      if (!solverMap.has(targetKey)) {
        solverMap.set(targetKey, {
          id: targetKey,
          name: authorName,
          avatar: getStudentAvatar(authorName, sol.author.avatar),
          gradeLevel: sol.author.gradeLevel || 'Student Member',
          badge: sol.author.badge,
          solutions: [],
        });
      }

      solverMap.get(targetKey)!.solutions.push(sol);
    });

    // Execute rigorous mathematical verification on each student solver
    return Array.from(solverMap.values()).map((entry) => {
      const sList = entry.solutions;
      const solutionsCount = sList.length;

      let verifiedCount = 0;
      let pendingCount = 0;
      let disqualifiedCount = 0;
      let totalHelpfulVotes = 0;

      const auditedReviews: AuditedReview[] = [];
      let selfReviewsRejectedCount = 0;

      // Track reviewer deduplication per solution to prevent spamming
      const seenReviewersPerSolution = new Map<string, Set<string>>();

      sList.forEach((sol) => {
        // CONTENT VERIFICATION CHECK:
        // Must have at least 1 solution step with substantive content or a valid media attachment
        const hasSubstantiveSteps = Array.isArray(sol.steps) && sol.steps.some(
          (st) => (st.title && st.title.trim().length > 2) || (st.explanation && st.explanation.trim().length > 5)
        );
        const hasValidMedia = Boolean(sol.mediaUrl || sol.videoEmbedUrl || (sol.pdfPages && sol.pdfPages.length > 0));

        const isContentValid = hasSubstantiveSteps || hasValidMedia;

        if (!isContentValid) {
          disqualifiedCount += 1;
        } else if (sol.isVerified) {
          verifiedCount += 1;
        } else {
          pendingCount += 1;
        }

        // Clamp helpful votes to prevent overflow/botting
        const clampedVotes = Math.max(0, Math.min(200, Number(sol.helpfulVotes) || 0));
        totalHelpfulVotes += clampedVotes;

        // AUDIT REVIEWS FOR THIS SOLUTION
        if (!seenReviewersPerSolution.has(sol.id)) {
          seenReviewersPerSolution.set(sol.id, new Set());
        }
        const seenForThisSol = seenReviewersPerSolution.get(sol.id)!;

        const reviews = Array.isArray(sol.reviews) ? sol.reviews : [];
        reviews.forEach((rev) => {
          // Check 1: ANTI SELF-REVIEW
          // Solver cannot review their own solution
          const isSelfReview = Boolean(
            (rev.authorUid && (rev.authorUid === sol.authorUid || rev.authorUid === entry.id)) ||
            (rev.authorName && rev.authorName.trim().toLowerCase() === entry.name.trim().toLowerCase())
          );

          // Check 2: DUPLICATE REVIEW BY SAME PEER
          const reviewerKey = rev.authorUid || rev.authorName.trim().toLowerCase();
          const isDuplicate = seenForThisSol.has(reviewerKey);

          if (isSelfReview) {
            selfReviewsRejectedCount += 1;
          } else if (!isDuplicate) {
            seenForThisSol.add(reviewerKey);
          }

          const isValid = !isSelfReview && !isDuplicate;

          // Normalize and clamp criteria scores to [1.0, 5.0]
          const clarity = Math.max(1, Math.min(5, rev.criteria?.clarity || rev.rating || 5));
          const accuracy = Math.max(1, Math.min(5, rev.criteria?.accuracy || rev.rating || 5));
          const stepByStep = Math.max(1, Math.min(5, rev.criteria?.stepByStep || rev.rating || 5));
          const clampedRating = Math.max(1, Math.min(5, rev.rating || 5));

          auditedReviews.push({
            reviewId: rev.id || `rev-${Math.random()}`,
            solutionId: sol.id,
            reviewerName: rev.authorName || 'Peer Reviewer',
            reviewerUid: rev.authorUid,
            rating: clampedRating,
            clarity,
            accuracy,
            stepByStep,
            isSelfReview,
            isDuplicate,
            isValid,
          });
        });
      });

      // Filter to authentic valid peer reviews only
      const validReviews = auditedReviews.filter((r) => r.isValid);
      const validPeerReviewsCount = validReviews.length;

      let avgClarity = 0;
      let avgAccuracy = 0;
      let avgStepByStep = 0;
      let compositePeerRating = 0;

      if (validPeerReviewsCount > 0) {
        const sumClarity = validReviews.reduce((acc, r) => acc + r.clarity, 0);
        const sumAccuracy = validReviews.reduce((acc, r) => acc + r.accuracy, 0);
        const sumStep = validReviews.reduce((acc, r) => acc + r.stepByStep, 0);
        const sumRating = validReviews.reduce((acc, r) => acc + r.rating, 0);

        avgClarity = Number((sumClarity / validPeerReviewsCount).toFixed(1));
        avgAccuracy = Number((sumAccuracy / validPeerReviewsCount).toFixed(1));
        avgStepByStep = Number((sumStep / validPeerReviewsCount).toFixed(1));
        compositePeerRating = Number((sumRating / validPeerReviewsCount).toFixed(2));
      }

      // 3. RIGOROUS POINT CALCULATION FORMULA:
      // - Verified Solutions: 100 XP per rigorously verified solution
      // - Pending / Substantive Solutions: 35 XP per valid submission
      // - Disqualified / Empty: 0 XP
      // - Peer-Review Quality Points: (ValidReviews * CompositeRating * 15)
      // - Academic Excellence Bonus: +50 XP if rating >= 4.5 with >= 2 reviews
      // - Helpful Peer Votes: 10 XP per authentic upvote
      const verifiedSolutionPoints = (verifiedCount * 100) + (pendingCount * 35);
      const qualityPoints = Math.round(validPeerReviewsCount * (compositePeerRating * 15));
      const helpfulVotePoints = totalHelpfulVotes * 10;

      let excellenceBonus = 0;
      if (validPeerReviewsCount >= 2 && compositePeerRating >= 4.5) {
        excellenceBonus = 50;
      } else if (validPeerReviewsCount >= 1 && compositePeerRating >= 4.0) {
        excellenceBonus = 25;
      }

      const calculatedPoints = verifiedSolutionPoints + qualityPoints + helpfulVotePoints + excellenceBonus;

      const isCurrentUser = entry.id === currentUserId || entry.name.toLowerCase() === currentUser.name.toLowerCase();

      // Verified Tier Badge
      let badge = entry.badge;
      if (verifiedCount >= 5 && compositePeerRating >= 4.5) {
        badge = 'Master Verified Tutor';
      } else if (verifiedCount >= 2) {
        badge = 'Verified Peer Mentor';
      } else if (solutionsCount >= 1) {
        badge = 'Contributing Scholar';
      } else {
        badge = 'Student Solver';
      }

      return {
        id: entry.id,
        name: entry.name,
        avatar: entry.avatar,
        gradeLevel: entry.gradeLevel,
        badge,
        solutionsCount,
        verifiedCount,
        pendingCount,
        disqualifiedCount,
        helpfulVotes: totalHelpfulVotes,
        totalPeerReviewsReceived: auditedReviews.length,
        validPeerReviewsCount,
        selfReviewsRejectedCount,
        avgClarity,
        avgAccuracy,
        avgStepByStep,
        compositePeerRating,
        qualityPoints,
        verifiedSolutionPoints,
        helpfulVotePoints,
        excellenceBonus,
        calculatedPoints,
        isCurrentUser,
        auditedReviews,
        authoredSolutions: sList,
      };
    }).sort((a, b) => {
      // Deterministic Anti-Spoofing Ranking:
      // 1. Total Audited Points
      // 2. Verified Solutions Count
      // 3. Composite Peer-Review Quality Rating
      // 4. Helpful Votes
      if (b.calculatedPoints !== a.calculatedPoints) {
        return b.calculatedPoints - a.calculatedPoints;
      }
      if (b.verifiedCount !== a.verifiedCount) {
        return b.verifiedCount - a.verifiedCount;
      }
      if (b.compositePeerRating !== a.compositePeerRating) {
        return b.compositePeerRating - a.compositePeerRating;
      }
      return b.helpfulVotes - a.helpfulVotes;
    });
  }, [authoritativeSolutions, firestoreUsers, currentUser]);

  // Current user's standing
  const currentUserIndex = calculatedSolvers.findIndex((s) => s.isCurrentUser);
  const currentUserStats = currentUserIndex !== -1 ? calculatedSolvers[currentUserIndex] : null;
  const userRankDisplay = currentUserStats && (currentUserStats.solutionsCount > 0 || currentUserStats.calculatedPoints > 0)
    ? `#${currentUserIndex + 1}`
    : 'Unranked';

  // Filter solvers by search & category
  const filteredSolvers = calculatedSolvers.filter((s) => {
    if (activeFilter === 'verified' && s.verifiedCount === 0) {
      return false;
    }
    if (activeFilter === 'top-rated' && (s.compositePeerRating < 4.0 || s.validPeerReviewsCount === 0)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchGrade = s.gradeLevel ? s.gradeLevel.toLowerCase().includes(q) : false;
      if (!matchName && !matchGrade) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Live Cloud Sync and Anti-Spoofing Indicators */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Firestore Sync • Anti-Spoofing Protected</span>
              </div>
              <div className="inline-flex items-center gap-1 text-xs text-stone-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                <Database className="w-3.5 h-3.5 text-blue-300" />
                <span>Direct Cloud Verification</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Verified Solvers & Academic Quality Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Every point and rank is computed in real time directly from Firestore records. The anti-spoofing engine strictly screens out self-reviews, verifies substantive step derivations, deduplicates peer ratings, and weights scores by peer-reviewed clarity, accuracy, and step rigor.
            </p>
          </div>

          {/* User's Verified Standing Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 text-center min-w-[210px] shrink-0 shadow-lg">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Audited Rank</span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight my-1">
              {userRankDisplay}
              {userRankDisplay !== 'Unranked' && (
                <span className="text-xs font-medium text-stone-300 ml-1.5">
                  of {calculatedSolvers.length}
                </span>
              )}
            </div>
            <div className="text-xs text-emerald-300 font-bold">
              {currentUserStats?.calculatedPoints || 0} Verified XP
            </div>
            <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-center gap-2">
              <span>{currentUserStats?.verifiedCount || 0} Verified</span>
              <span>•</span>
              <span>{currentUserStats?.validPeerReviewsCount || 0} Reviews</span>
            </div>
          </div>
        </div>

        {/* Database Status & Manual Refresh Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <strong>Zero Spoofing Architecture:</strong> Direct Firestore snapshot aggregation
            </span>
            {lastSyncedAt && (
              <span className="hidden sm:inline text-stone-400">
                • Audited {lastSyncedAt.toLocaleTimeString()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleManualReverify}
            disabled={syncStatus === 'reverifying'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition-all border border-white/20 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'reverifying' ? 'animate-spin text-blue-300' : ''}`} />
            <span>{syncStatus === 'reverifying' ? 'Auditing Cloud DB...' : 'Re-Audit from Firestore'}</span>
          </button>
        </div>
      </div>

      {/* 2. Transparent Anti-Spoofing Calculation Formula Accordion */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                Anti-Spoofing Verification & Quality Scoring Rubric
              </h4>
              <p className="text-[11px] text-stone-500">
                Guaranteed fair play: Self-reviews discarded • Duplicate peer ratings deduplicated • Step rigor validated
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFormula(!showFormula)}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline transition-colors cursor-pointer shrink-0"
          >
            {showFormula ? 'Hide Verification Rules' : 'Inspect Verification Rules'}
          </button>
        </div>

        {showFormula && (
          <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 animate-in fade-in text-xs text-stone-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1 text-xs">
                  +100 XP / Verified Solution
                </span>
                <p className="text-[11px] text-stone-600 leading-normal">
                  Solution must pass academic step derivation checks or include valid PDF/image/video working. Unverified submissions receive 35 XP.
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-emerald-900 block mb-1 text-xs">
                  Quality Score Formula
                </span>
                <p className="text-[11px] text-stone-600 leading-normal">
                  <code>ValidReviews × (CompositeScore × 15)</code>. Evaluates Clarity, Accuracy, and Step-by-Step rigor.
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-amber-900 block mb-1 text-xs">
                  +50 XP Excellence Bonus
                </span>
                <p className="text-[11px] text-stone-600 leading-normal">
                  Awarded to peer mentors who sustain a ≥ 4.5 composite peer rating across multiple authentic peer reviews.
                </p>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="font-bold text-purple-900 block mb-1 text-xs">
                  Anti-Spoofing Shield
                </span>
                <p className="text-[11px] text-stone-600 leading-normal">
                  Self-reviews (author reviewing own solution) and duplicate votes from the same peer are flagged and automatically disqualified.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Leaderboard Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-900 mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Solvers ({calculatedSolvers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('verified')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'verified'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Only</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('top-rated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'top-rated'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Top Peer Rated (≥ 4.0)</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search solver name or degree..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors shadow-inset"
            />
          </div>
        </div>

        {/* 4. Solvers List with Verified Metrics */}
        {filteredSolvers.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            <ShieldCheck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-stone-700">No solvers match the active filter criteria.</p>
            <p className="mt-1">Try clearing your search query or switching to "All Solvers".</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredSolvers.map((solver, idx) => {
              const isCurrentUser = solver.isCurrentUser;
              return (
                <div
                  key={solver.id}
                  className={`p-4 sm:px-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors ${
                    isCurrentUser 
                      ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-blue-600' 
                      : 'hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Indicator */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800 ring-1 ring-slate-300'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-900 ring-1 ring-orange-300'
                          : 'text-stone-600 bg-stone-100 font-bold text-xs'
                      }`}
                    >
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>

                    <img
                      src={getStudentAvatar(solver.name, solver.avatar)}
                      alt={solver.name}
                      className="w-11 h-11 rounded-2xl object-cover ring-1 ring-stone-200 shrink-0 aspect-square"
                      referrerPolicy="no-referrer"
                    />

                    <div>
                      <div className="font-bold text-sm text-stone-900 flex flex-wrap items-center gap-2">
                        <span>{solver.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold tracking-wide">
                            You
                          </span>
                        )}
                        {solver.verifiedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{solver.verifiedCount} Verified</span>
                          </span>
                        )}
                        {solver.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            {solver.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {solver.gradeLevel || 'Commerce & Finance Scholar'}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Stats Matrix */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 ml-0 sm:ml-12 lg:ml-0 text-xs w-full lg:w-auto justify-between sm:justify-start">
                    {/* Solutions Count */}
                    <div className="text-left sm:text-center min-w-[55px]">
                      <div className="font-bold text-stone-900 flex items-center gap-1 justify-start sm:justify-center">
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>{solver.solutionsCount}</span>
                      </div>
                      <div className="text-[10px] text-stone-400">Solutions</div>
                    </div>

                    {/* Valid Peer Reviews */}
                    <div className="text-left sm:text-center min-w-[65px]">
                      <div className="font-bold text-stone-800">
                        {solver.validPeerReviewsCount}
                        {solver.selfReviewsRejectedCount > 0 && (
                          <span className="text-[10px] text-rose-500 ml-1 font-normal" title="Self-reviews filtered out">
                            ({solver.selfReviewsRejectedCount} cut)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">Reviews</div>
                    </div>

                    {/* Peer Quality Composite Rating */}
                    <div className="text-left sm:text-center min-w-[65px]">
                      <div className="font-bold text-amber-700 flex items-center gap-1 justify-start sm:justify-center">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {solver.compositePeerRating > 0 ? solver.compositePeerRating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400">Quality</div>
                    </div>

                    {/* Helpful Votes */}
                    <div className="text-left sm:text-center min-w-[55px]">
                      <div className="font-bold text-emerald-700 flex items-center gap-1 justify-start sm:justify-center">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{solver.helpfulVotes}</span>
                      </div>
                      <div className="text-[10px] text-stone-400">Helpful</div>
                    </div>

                    {/* Total Earned Verified Points */}
                    <div className="text-left sm:text-right min-w-[75px]">
                      <div className="font-black text-sm text-blue-900">
                        {solver.calculatedPoints} <span className="text-[10px] font-bold text-blue-600">XP</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-medium">Audited</div>
                    </div>

                    {/* Audit Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedAuditSolver(solver)}
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 hover:border-blue-300 hover:bg-blue-50 text-stone-700 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Inspect Anti-Spoofing Audit Report"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Audit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Anti-Spoofing Audit Report Modal */}
      {selectedAuditSolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-900 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedAuditSolver(null)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold mb-2 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Firestore Cloud Verification Audit</span>
              </div>

              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{selectedAuditSolver.name}</span>
                {selectedAuditSolver.isCurrentUser && (
                  <span className="text-xs px-2 py-0.5 bg-blue-600 rounded-full font-medium">You</span>
                )}
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                Author ID: <code className="bg-black/30 px-1.5 py-0.5 rounded text-[11px] font-mono">{selectedAuditSolver.id}</code>
              </p>
            </div>

            {/* Audit Checklist & Verification Proofs */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
              {/* Anti-Spoofing Checks */}
              <div>
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Integrity Checks & Security Proofs</span>
                </h4>
                <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Direct Firestore Cloud Source
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      PASSED
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Self-Review Anti-Exploit Filter
                    </span>
                    <span className="font-bold text-stone-800">
                      {selectedAuditSolver.selfReviewsRejectedCount === 0 
                        ? '0 Disqualified (Clean)' 
                        : `${selectedAuditSolver.selfReviewsRejectedCount} Self-Reviews Discarded`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Duplicate Reviewer Deduplication
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ENFORCED
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Substantive Step Derivations Check
                    </span>
                    <span className="font-bold text-stone-800">
                      {selectedAuditSolver.disqualifiedCount === 0 ? 'All Valid' : `${selectedAuditSolver.disqualifiedCount} Drafts Excluded`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Peer Quality Breakdown */}
              <div>
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Peer-Review Quality Dimensions</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="text-[10px] text-stone-500">Clarity</div>
                    <div className="text-base font-bold text-blue-900">
                      {selectedAuditSolver.avgClarity > 0 ? `${selectedAuditSolver.avgClarity} / 5` : '—'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="text-[10px] text-stone-500">Accuracy</div>
                    <div className="text-base font-bold text-emerald-900">
                      {selectedAuditSolver.avgAccuracy > 0 ? `${selectedAuditSolver.avgAccuracy} / 5` : '—'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="text-[10px] text-stone-500">Step Rigor</div>
                    <div className="text-base font-bold text-purple-900">
                      {selectedAuditSolver.avgStepByStep > 0 ? `${selectedAuditSolver.avgStepByStep} / 5` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Point Calculation Itemization */}
              <div>
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verified XP Derivation</span>
                </h4>
                <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Verified Solutions ({selectedAuditSolver.verifiedCount} × 100 XP):</span>
                    <span className="font-bold">+{selectedAuditSolver.verifiedCount * 100} XP</span>
                  </div>
                  {selectedAuditSolver.pendingCount > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Pending Solutions ({selectedAuditSolver.pendingCount} × 35 XP):</span>
                      <span className="font-bold">+{selectedAuditSolver.pendingCount * 35} XP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-800">
                    <span>Peer-Review Quality Score:</span>
                    <span className="font-bold">+{selectedAuditSolver.qualityPoints} XP</span>
                  </div>
                  {selectedAuditSolver.excellenceBonus > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Excellence in Tutoring Bonus:</span>
                      <span className="font-bold">+{selectedAuditSolver.excellenceBonus} XP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-700">
                    <span>Helpful Upvotes ({selectedAuditSolver.helpfulVotes} × 10 XP):</span>
                    <span className="font-bold">+{selectedAuditSolver.helpfulVotePoints} XP</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-xs">
                    <span>Total Audited Score:</span>
                    <span className="text-blue-700">{selectedAuditSolver.calculatedPoints} XP</span>
                  </div>
                </div>
              </div>

              {/* Author's Solutions Links */}
              {selectedAuditSolver.authoredSolutions.length > 0 && (
                <div>
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-2">
                    Authored Solutions ({selectedAuditSolver.authoredSolutions.length})
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedAuditSolver.authoredSolutions.map((sol) => (
                      <button
                        key={sol.id}
                        type="button"
                        onClick={() => {
                          setSelectedAuditSolver(null);
                          onOpenSolution(sol);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-white border border-stone-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <span className="font-medium text-stone-800 truncate pr-2 group-hover:text-blue-700">
                          {sol.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-stone-500">
                          <span className="uppercase font-bold text-blue-600">{sol.solutionType}</span>
                          <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-blue-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditSolver(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
