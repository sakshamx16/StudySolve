import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Sparkles, 
  Users, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  CheckCircle2,
  X,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { initialGroups, GUEST_USER } from './data/initialData';
import { 
  StudyGroup, 
  StudyMaterial, 
  Solution, 
  SolutionReview,
  UserProfile, 
  Subject, 
  DifficultyLevel,
  SolutionMediaType 
} from './types';
import { 
  getStoredGroups, 
  saveStoredGroups, 
  getStoredMaterials, 
  saveStoredMaterials, 
  getStoredSolutions, 
  saveStoredSolutions, 
  getStoredUser, 
  saveStoredUser,
  clearStoredUser,
  resetToDemoData 
} from './utils/storage';
import { getStudentAvatar } from './utils/avatar';
import { ThemeMode, getInitialTheme, applyTheme, saveThemePreference } from './utils/theme';
import Header from './components/Header';
import BeginnerGuideBanner from './components/BeginnerGuideBanner';
import FilterBar from './components/FilterBar';
import MaterialCard from './components/MaterialCard';
import MaterialDetailModal from './components/MaterialDetailModal';
import SolutionViewerModal from './components/SolutionViewerModal';
import PostSolutionModal from './components/PostSolutionModal';
import CreateMaterialModal from './components/CreateMaterialModal';
import CreateGroupModal from './components/CreateGroupModal';
import EditProfileModal from './components/EditProfileModal';
import AuthModal from './components/AuthModal';
import StudyGroupsList from './components/StudyGroupsList';
import TopSolutionsView from './components/TopSolutionsView';
import TopSolversLeaderboard from './components/TopSolversLeaderboard';
import AIChatbox from './components/AIChatbox';
import SelectQuestionToSolveModal from './components/SelectQuestionToSolveModal';
import { 
  auth, 
  signOutUser, 
  subscribeToFirestoreMaterials, 
  subscribeToFirestoreSolutions, 
  subscribeToFirestoreGroups,
  addMaterialToFirestore, 
  deleteMaterialFromFirestore, 
  addSolutionToFirestore, 
  addGroupToFirestore,
  deleteGroupFromFirestore,
  syncUserProfileToFirestore,
  fetchUserProfileFromFirestore 
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Persistent data state
  const [groups, setGroups] = useState<StudyGroup[]>(getStoredGroups);
  const [materials, setMaterials] = useState<StudyMaterial[]>(getStoredMaterials);
  const [solutions, setSolutions] = useState<Solution[]>(getStoredSolutions);
  const [user, setUser] = useState<UserProfile>(getStoredUser);

  // Sync with localStorage
  useEffect(() => {
    saveStoredGroups(groups);
  }, [groups]);

  useEffect(() => {
    saveStoredMaterials(materials);
  }, [materials]);

  useEffect(() => {
    saveStoredSolutions(solutions);
  }, [solutions]);

  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  // Navigation & Group filter with URL synchronization
  const getInitialTab = (): 'materials' | 'groups' | 'top-solutions' | 'leaderboard' => {
    if (typeof window === 'undefined') return 'materials';
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toLowerCase();

    if (tabParam === 'groups' || path.startsWith('/groups')) return 'groups';
    if (tabParam === 'top-solutions' || tabParam === 'solutions' || path.startsWith('/top-solutions')) return 'top-solutions';
    if (tabParam === 'leaderboard' || path.startsWith('/leaderboard')) return 'leaderboard';
    if (tabParam === 'materials' || path.startsWith('/materials')) return 'materials';
    return 'materials';
  };

  const [activeTab, setActiveTab] = useState<'materials' | 'groups' | 'top-solutions' | 'leaderboard'>(getInitialTab);

  const handleTabChange = (tab: 'materials' | 'groups' | 'top-solutions' | 'leaderboard') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const targetUrl = tab === 'materials' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ tab }, '', targetUrl);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme state (Dark / Light mode) - Light mode is the default
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      saveThemePreference(next);
      return next;
    });
  };

  // Filtering states for materials
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'pdf' | 'image' | 'video'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'newest' | 'solutions' | 'dueDate'>('rating');

  // Modals state
  const [detailMaterial, setDetailMaterial] = useState<StudyMaterial | null>(null);
  const [postSolutionMaterial, setPostSolutionMaterial] = useState<StudyMaterial | null>(null);
  const [viewerSolution, setViewerSolution] = useState<Solution | null>(null);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSelectQuestionToSolveOpen, setIsSelectQuestionToSolveOpen] = useState(false);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let cloudProfile: UserProfile | null = null;
        try {
          cloudProfile = await fetchUserProfileFromFirestore(firebaseUser.uid);
        } catch (err) {
          console.warn('Could not fetch cloud profile:', err);
        }

        setUser((prev) => {
          const studentName = cloudProfile?.name || firebaseUser.displayName || prev.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Student Scholar');
          
          // Determine avatar with strict priority:
          // 1. Cloud profile custom avatar
          // 2. Previously selected website avatar if custom
          // 3. Cloud profile's existing avatar
          // 4. Initial fallback: Google photoURL or deterministic avatar
          let resolvedAvatar = '';
          const isPrevCustom = prev.hasCustomAvatar || (prev.avatar && prev.id !== 'guest' && !prev.avatar.includes('googleusercontent.com'));

          if (cloudProfile?.hasCustomAvatar && cloudProfile.avatar) {
            resolvedAvatar = cloudProfile.avatar;
          } else if (isPrevCustom && prev.avatar) {
            resolvedAvatar = prev.avatar;
          } else if (cloudProfile?.avatar && !cloudProfile.avatar.includes('googleusercontent.com')) {
            resolvedAvatar = cloudProfile.avatar;
          } else if (cloudProfile?.avatar) {
            resolvedAvatar = cloudProfile.avatar;
          } else {
            resolvedAvatar = firebaseUser.photoURL || getStudentAvatar(studentName);
          }

          const hasCustom = Boolean(
            cloudProfile?.hasCustomAvatar ||
            isPrevCustom ||
            (resolvedAvatar && !resolvedAvatar.includes('googleusercontent.com'))
          );

          const updated: UserProfile = {
            ...prev,
            ...(cloudProfile || {}),
            id: firebaseUser.uid,
            authUid: firebaseUser.uid,
            name: studentName,
            email: firebaseUser.email || undefined,
            avatar: resolvedAvatar,
            hasCustomAvatar: hasCustom,
            customAvatar: hasCustom ? resolvedAvatar : (cloudProfile?.customAvatar || prev.customAvatar),
            isAnonymous: firebaseUser.isAnonymous,
          };

          syncUserProfileToFirestore(updated).catch(() => {});
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for materials, solutions, and user-created groups
  useEffect(() => {
    const LEGACY_DUMMY_GROUP_IDS = [
      'grp-accounting',
      'grp-taxation',
      'grp-economics',
      'grp-costing',
      'grp-finance',
      'grp-law'
    ];

    const unsubGroups = subscribeToFirestoreGroups((liveGroups) => {
      if (liveGroups && Array.isArray(liveGroups)) {
        // Automatically delete any lingering legacy dummy groups if found in Firestore
        liveGroups.forEach((g) => {
          if (LEGACY_DUMMY_GROUP_IDS.includes(g.id)) {
            deleteGroupFromFirestore(g.id).catch(() => {});
          }
        });
        const valid = liveGroups.filter((g) => !LEGACY_DUMMY_GROUP_IDS.includes(g.id));
        setGroups(valid);
      }
    });

    const unsubMaterials = subscribeToFirestoreMaterials((liveMaterials) => {
      if (liveMaterials && liveMaterials.length > 0) {
        setMaterials(liveMaterials);
      }
    });

    const unsubSolutions = subscribeToFirestoreSolutions((liveSolutions) => {
      if (liveSolutions && liveSolutions.length > 0) {
        setSolutions(liveSolutions);
      }
    });

    return () => {
      unsubGroups();
      unsubMaterials();
      unsubSolutions();
    };
  }, []);

  // Available subjects for filtering (combining materials & groups)
  const availableSubjects = useMemo(() => {
    const fromMaterials = materials.map((m) => m.subject);
    const fromGroups = groups.map((g) => g.subject);
    return Array.from(new Set([...fromMaterials, ...fromGroups])).filter(Boolean);
  }, [materials, groups]);

  // Filtered & Sorted Study Materials
  const filteredMaterials = useMemo(() => {
    return materials
      .filter((mat) => {
        // Group filter
        if (selectedGroupId && mat.groupId !== selectedGroupId) {
          return false;
        }
        // Subject filter
        if (selectedSubject !== 'All' && mat.subject !== selectedSubject) {
          return false;
        }
        // Difficulty filter
        if (selectedDifficulty !== 'All' && mat.difficulty !== selectedDifficulty) {
          return false;
        }
        // Status filter
        if (selectedStatus === 'solved' && !mat.isSolved) {
          return false;
        }
        if (selectedStatus === 'unsolved' && mat.isSolved) {
          return false;
        }
        // Solution format filter
        if (selectedFormat !== 'all') {
          const matSolutions = solutions.filter((s) => s.materialId === mat.id);
          const matchesFormat = matSolutions.some((s) => s.solutionType === selectedFormat);
          if (!matchesFormat) return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = mat.title.toLowerCase().includes(q);
          const matchTopic = mat.topic.toLowerCase().includes(q);
          const matchSubject = mat.subject.toLowerCase().includes(q);
          const matchGroup = mat.groupName.toLowerCase().includes(q);
          const matchPrompt = mat.problemStatement.toLowerCase().includes(q);
          const matchTags = mat.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchTopic && !matchSubject && !matchGroup && !matchPrompt && !matchTags) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.averageRating - a.averageRating;
        }
        if (sortBy === 'solutions') {
          return b.solutionsCount - a.solutionsCount;
        }
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        // 'newest'
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    materials,
    solutions,
    selectedGroupId,
    selectedSubject,
    selectedDifficulty,
    selectedStatus,
    selectedFormat,
    searchQuery,
    sortBy,
  ]);

  // Handler: Add new study material
  const handleAddMaterial = (newMaterial: StudyMaterial) => {
    setMaterials((prev) => [newMaterial, ...prev]);

    // Save to Firestore
    addMaterialToFirestore(newMaterial).catch((err) => {
      console.warn('Could not sync material to Firestore:', err);
    });

    // Update group's materials count
    setGroups((prev) =>
      prev.map((g) =>
        g.id === newMaterial.groupId
          ? { ...g, materialsCount: g.materialsCount + 1 }
          : g
      )
    );

    // Update user stats
    setUser((prev) => ({
      ...prev,
      materialsShared: prev.materialsShared + 1,
      points: prev.points + 25,
    }));
  };

  // Handler: Delete study material (for questions sent mistakenly)
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await deleteMaterialFromFirestore(materialId);
    } catch (err) {
      console.warn('Could not delete from Firestore:', err);
    }
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    setSolutions((prev) => prev.filter((s) => s.materialId !== materialId));
    if (detailMaterial && detailMaterial.id === materialId) {
      setDetailMaterial(null);
    }
  };

  // Handler: Sign out
  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    clearStoredUser();
    setUser(GUEST_USER);
  };

  // Handler: Submit solution
  const handlePostSolution = (newSolutionData: any) => {
    const newSolutionId = `sol-${Date.now()}`;
    const newSolution: Solution = {
      ...newSolutionData,
      id: newSolutionId,
      createdAt: 'Just now',
      averageRating: 5.0,
      ratingsCount: 1,
      criteriaBreakdown: {
        clarity: 5.0,
        accuracy: 5.0,
        stepByStep: 5.0,
      },
      reviews: [
        {
          id: `rev-${Date.now()}`,
          authorName: user.name,
          authorAvatar: user.avatar,
          rating: 5,
          criteria: { clarity: 5, accuracy: 5, stepByStep: 5 },
          feedbackText: 'Initial verified solution author notes and methodology.',
          helpfulTags: ['Original Solver', 'Step-by-Step'],
          createdAt: 'Just now',
          likes: 1,
        },
      ],
      isVerified: true,
      helpfulVotes: 1,
    };

    setSolutions((prev) => [newSolution, ...prev]);

    // Save to Firestore
    addSolutionToFirestore(newSolution).catch((err) => {
      console.warn('Could not sync solution to Firestore:', err);
    });

    // Mark material as solved and increment count
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === newSolutionData.materialId
          ? {
              ...m,
              solutionsCount: m.solutionsCount + 1,
              isSolved: true,
              averageRating: m.averageRating > 0 ? (m.averageRating + 5.0) / 2 : 5.0,
            }
          : m
      )
    );

    // Update user stats
    setUser((prev) => ({
      ...prev,
      solutionsSubmitted: prev.solutionsSubmitted + 1,
      points: prev.points + 50,
    }));

    // If detail modal is open for this material, refresh it
    if (detailMaterial && detailMaterial.id === newSolutionData.materialId) {
      setDetailMaterial((prev) =>
        prev
          ? {
              ...prev,
              solutionsCount: prev.solutionsCount + 1,
              isSolved: true,
            }
          : null
      );
    }
  };

  // Handler: Add rating and feedback review
  const handleAddReview = (
    solutionId: string,
    rating: number,
    criteria: { clarity: number; accuracy: number; stepByStep: number },
    feedbackText: string,
    helpfulTags: string[]
  ) => {
    const newReview: SolutionReview = {
      id: `rev-${Date.now()}`,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorUid: user.authUid || user.id,
      rating,
      criteria,
      feedbackText,
      helpfulTags,
      createdAt: 'Just now',
      likes: 0,
    };

    setSolutions((prev) =>
      prev.map((sol) => {
        if (sol.id !== solutionId) return sol;

        const updatedReviews = [newReview, ...sol.reviews];
        const newCount = sol.ratingsCount + 1;

        // Recalculate average rating
        const newAvgRating =
          (sol.averageRating * sol.ratingsCount + rating) / newCount;

        // Recalculate granular criteria averages
        const newClarity =
          (sol.criteriaBreakdown.clarity * sol.ratingsCount + criteria.clarity) / newCount;
        const newAccuracy =
          (sol.criteriaBreakdown.accuracy * sol.ratingsCount + criteria.accuracy) / newCount;
        const newStepByStep =
          (sol.criteriaBreakdown.stepByStep * sol.ratingsCount + criteria.stepByStep) / newCount;

        const updatedSolution = {
          ...sol,
          ratingsCount: newCount,
          averageRating: Number(newAvgRating.toFixed(1)),
          criteriaBreakdown: {
            clarity: Number(newClarity.toFixed(1)),
            accuracy: Number(newAccuracy.toFixed(1)),
            stepByStep: Number(newStepByStep.toFixed(1)),
          },
          reviews: updatedReviews,
        };

        // Persist review to Firestore for anti-spoofing cloud verification
        addSolutionToFirestore(updatedSolution).catch((err) => {
          console.warn('Could not sync review to Firestore:', err);
        });

        // If viewer solution is open, keep it in sync
        if (viewerSolution && viewerSolution.id === solutionId) {
          setViewerSolution(updatedSolution);
        }

        return updatedSolution;
      })
    );

    // Give user XP for contributing quality feedback
    setUser((prev) => ({
      ...prev,
      points: prev.points + 15,
    }));
  };

  // Handler: Vote solution as helpful
  const handleVoteHelpful = (solutionId: string) => {
    setSolutions((prev) =>
      prev.map((sol) => {
        if (sol.id !== solutionId) return sol;
        const wasVoted = sol.hasVotedHelpful;
        const updated = {
          ...sol,
          helpfulVotes: wasVoted ? Math.max(0, sol.helpfulVotes - 1) : sol.helpfulVotes + 1,
          hasVotedHelpful: !wasVoted,
        };

        // Persist helpful vote to Firestore
        addSolutionToFirestore(updated).catch((err) => {
          console.warn('Could not sync helpful vote to Firestore:', err);
        });

        if (viewerSolution && viewerSolution.id === solutionId) {
          setViewerSolution(updated);
        }
        return updated;
      })
    );
  };

  // Handler: Join/Leave group
  const handleToggleJoinGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const nowJoined = !g.isJoined;
        const updated: StudyGroup = {
          ...g,
          isJoined: nowJoined,
          memberCount: nowJoined ? g.memberCount + 1 : Math.max(1, g.memberCount - 1),
        };
        addGroupToFirestore(updated).catch(() => {});
        return updated;
      })
    );
  };

  // Handler: Add new group
  const handleAddGroup = (newGroup: StudyGroup) => {
    setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
    addGroupToFirestore(newGroup).catch((err) => {
      console.warn('Could not save group to Firestore:', err);
    });
  };

  // Handler: Delete study group
  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
    setUser((prev) => ({
      ...prev,
      joinedGroupIds: prev.joinedGroupIds.filter((id) => id !== groupId),
    }));
    deleteGroupFromFirestore(groupId).catch((err) => {
      console.warn('Could not delete group from Firestore:', err);
    });
  };

  // Handler: Restore default groups (clean empty state)
  const handleRestoreDefaultGroups = () => {
    setGroups([]);
  };

  // Handler: Update user profile
  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  // Handler: Reset demo data
  const handleResetDemoData = () => {
    resetToDemoData();
    setGroups(getStoredGroups());
    setMaterials(getStoredMaterials());
    setSolutions(getStoredSolutions());
    setUser(getStoredUser());
    setSelectedGroupId(null);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans flex flex-col selection:bg-blue-100 dark:selection:bg-blue-900/60 selection:text-blue-900 dark:selection:text-blue-100 overflow-x-hidden w-full max-w-[100vw] transition-colors">
      {/* Top Main Navigation Header */}
      <Header
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenShareModal={() => setIsCreateMaterialOpen(true)}
        onOpenCreateGroupModal={() => setIsCreateGroupOpen(true)}
        user={user}
        onResetDemoData={handleResetDemoData}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {/* Active Group Filter Banner (if a specific group is selected) */}
        {selectedGroupId && selectedGroup && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-2xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-xl shrink-0">
                {selectedGroup.badgeEmoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white">
                    {selectedGroup.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900">
                    {selectedGroup.subject}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xl">
                  {selectedGroup.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setIsCreateMaterialOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Problem to Group</span>
              </button>
              <button
                onClick={() => setSelectedGroupId(null)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-medium transition-colors cursor-pointer"
              >
                View All Groups
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${selectedGroup.name}"?`)) {
                    handleDeleteGroup(selectedGroup.id);
                  }
                }}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Delete this group"
                aria-label="Delete this group"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: STUDY MATERIALS & PROBLEMS */}
        {activeTab === 'materials' && (
          <div>
            {/* Beginner-friendly Guide Banner (dismissible) */}
            <BeginnerGuideBanner
              onExploreClick={() => {
                handleTabChange('materials');
                const el = document.getElementById('problems-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onPostClick={() => setIsCreateMaterialOpen(true)}
              onSolveClick={() => setIsSelectQuestionToSolveOpen(true)}
              onTopSolutionsClick={() => handleTabChange('top-solutions')}
              onSearchClick={() => {
                handleTabChange('materials');
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.focus();
                  searchInput.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const el = document.getElementById('problems-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            {/* Filter and sorting toolbar */}
            <div id="problems-section">
              <FilterBar
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                availableSubjects={availableSubjects}
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={setSelectedDifficulty}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                totalCount={filteredMaterials.length}
              />
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-10 sm:p-14 text-center max-w-xl mx-auto my-8 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  {materials.length === 0 ? 'Ready for your first question!' : 'No matching problems found'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                  {materials.length === 0
                    ? 'The workspace is fresh and ready. Upload an accounting, taxation, economics, business law, or financial management problem so your peers can solve and post PDF, image, or video solutions.'
                    : 'No materials match your current subject, format, or status filters. Try clearing your filters or upload a new problem.'}
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  {materials.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedSubject('All');
                        setSelectedFormat('all');
                        setSelectedDifficulty('All');
                        setSelectedStatus('all');
                        setSearchQuery('');
                        setSelectedGroupId(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                  <button
                    onClick={() => setIsCreateMaterialOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload First Question</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    solutions={solutions}
                    currentUser={user}
                    onOpenDetail={(mat) => setDetailMaterial(mat)}
                    onPostSolution={(mat) => setPostSolutionMaterial(mat)}
                    onSelectGroup={(grpId) => setSelectedGroupId(grpId)}
                    onDeleteMaterial={handleDeleteMaterial}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDY GROUPS VIEW */}
        {activeTab === 'groups' && (
          <StudyGroupsList
            groups={groups}
            onToggleJoinGroup={handleToggleJoinGroup}
            onSelectGroupMaterials={(groupId) => {
              setSelectedGroupId(groupId);
              handleTabChange('materials');
            }}
            onOpenCreateGroupModal={() => setIsCreateGroupOpen(true)}
            onDeleteGroup={handleDeleteGroup}
            onRestoreDefaultGroups={handleRestoreDefaultGroups}
          />
        )}

        {/* TAB 3: TOP SOLUTIONS SHOWCASE */}
        {activeTab === 'top-solutions' && (
          <TopSolutionsView
            solutions={solutions}
            onOpenSolution={(sol) => setViewerSolution(sol)}
            onVoteHelpful={handleVoteHelpful}
          />
        )}

        {/* TAB 4: LEADERBOARD & MENTORS */}
        {activeTab === 'leaderboard' && (
          <TopSolversLeaderboard
            solutions={solutions}
            currentUser={user}
            onOpenSolution={(sol) => setViewerSolution(sol)}
          />
        )}
      </main>

      {/* MODAL 1: Material Details & Solution List */}
      {detailMaterial && (
        <MaterialDetailModal
          material={detailMaterial}
          solutions={solutions}
          currentUser={user}
          onClose={() => setDetailMaterial(null)}
          onPostSolution={(mat) => {
            setDetailMaterial(null);
            setPostSolutionMaterial(mat);
          }}
          onOpenSolution={(sol) => setViewerSolution(sol)}
          onVoteHelpful={handleVoteHelpful}
          onDeleteMaterial={handleDeleteMaterial}
        />
      )}

      {/* MODAL 2: Post New Solution (PDF / Image / Video) */}
      {postSolutionMaterial && (
        <PostSolutionModal
          material={postSolutionMaterial}
          onClose={() => setPostSolutionMaterial(null)}
          onSubmitSolution={handlePostSolution}
          currentUser={user}
        />
      )}

      {/* MODAL 3: Solution Viewer & Interactive Rating Engine */}
      {viewerSolution && (
        <SolutionViewerModal
          solution={viewerSolution}
          onClose={() => setViewerSolution(null)}
          onAddReview={handleAddReview}
          onVoteHelpful={handleVoteHelpful}
          currentUser={user}
        />
      )}

      {/* MODAL 4: Share New Study Material */}
      <CreateMaterialModal
        isOpen={isCreateMaterialOpen}
        onClose={() => setIsCreateMaterialOpen(false)}
        groups={groups}
        selectedGroupId={selectedGroupId}
        onAddMaterial={handleAddMaterial}
        currentUser={user}
      />

      {/* MODAL 5: Create Study Group */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onAddGroup={handleAddGroup}
        currentUser={user}
      />

      {/* MODAL 6: Edit Student Profile & Avatar */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={user}
        onUpdateUser={handleSaveProfile}
      />

      {/* MODAL 7: Student Authentication & ID Switcher */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onAuthSuccess={(updatedUser) => {
          setUser(updatedUser);
          setIsAuthModalOpen(false);
        }}
      />

      {/* MODAL 8: Select Question To Solve (Step 2 in Beginner Guide) */}
      <SelectQuestionToSolveModal
        isOpen={isSelectQuestionToSolveOpen}
        onClose={() => setIsSelectQuestionToSolveOpen(false)}
        materials={materials}
        solutions={solutions}
        onSelectMaterialToSolve={(mat) => {
          setIsSelectQuestionToSolveOpen(false);
          setPostSolutionMaterial(mat);
        }}
      />

      {/* Floating AI Assistant Chatbox (Text + Image Question Solving) */}
      <AIChatbox />

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">StudySolve</span>
            <span>• Collaborative Peer Solutions with Verified Quality Ratings</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Formats: PDF • High-Res Image • Video Walkthrough</span>
            <span>•</span>
            <span>Rating Criteria: Clarity • Accuracy • Step-by-Step</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
