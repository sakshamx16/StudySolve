import { useState, useMemo } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  Check, 
  ArrowRight,
  Trash2,
  Lock,
  Key,
  LogIn,
  LogOut,
  Crown,
  Globe,
  Sparkles,
  Settings,
  MessageSquare
} from 'lucide-react';
import { StudyGroup, Subject, UserProfile } from '../types';
import { getStoredJoinedGroupIds, isRealGroupHost } from '../utils/storage';
import GroupMembersModal from './GroupMembersModal';
import EditGroupModal from './EditGroupModal';

interface StudyGroupsListProps {
  groups: StudyGroup[];
  onToggleJoinGroup: (groupId: string) => void;
  onSelectGroupMaterials: (groupId: string) => void;
  onOpenCreateGroupModal: () => void;
  onDeleteGroup: (groupId: string) => void;
  onRestoreDefaultGroups?: () => void;
  currentUser: UserProfile;
  onOpenAuthModal?: () => void;
  onOpenJoinCodeModal?: (targetGroupId?: string, code?: string) => void;
  onOpenInviteModal?: (group: StudyGroup) => void;
  selectedGroupId?: string | null;
  onSelectGroup?: (groupId: string | null) => void;
  onUpdateGroup?: (updatedGroup: StudyGroup) => void;
}

const subjects: (Subject | 'All')[] = [
  'All',
  'Financial Accounting',
  'Cost & Management Accounting',
  'Economics',
  'Taxation & GST',
  'Corporate & Business Law',
  'Financial Management & Investment',
  'Business Studies & Management',
  'Business Mathematics & Statistics',
  'Auditing & Assurance',
];

export default function StudyGroupsList({
  groups,
  onToggleJoinGroup,
  onSelectGroupMaterials,
  onOpenCreateGroupModal,
  onDeleteGroup,
  currentUser,
  onOpenAuthModal,
  onOpenJoinCodeModal,
  onOpenInviteModal,
  selectedGroupId,
  onSelectGroup,
  onUpdateGroup,
}: StudyGroupsListProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'my-groups' | 'public' | 'private'>('all');
  const [groupToDelete, setGroupToDelete] = useState<StudyGroup | null>(null);
  const [groupToLeave, setGroupToLeave] = useState<StudyGroup | null>(null);
  const [groupToEdit, setGroupToEdit] = useState<StudyGroup | null>(null);
  const [groupForMembers, setGroupForMembers] = useState<StudyGroup | null>(null);

  const isLoggedIn = Boolean(
    currentUser.name && 
    currentUser.name.trim().length > 0 &&
    currentUser.id !== 'guest'
  );

  const allSubjects = Array.from(
    new Set([
      ...subjects,
      ...groups.map((g) => g.subject).filter((s) => s && s.trim().length > 0),
    ])
  );

  const isGroupCreator = (group: StudyGroup): boolean => {
    return isRealGroupHost(group, currentUser);
  };

  const isUserMember = (group: StudyGroup): boolean => {
    // 1. Explicit joined flag
    if (group.isJoined) return true;
    // 2. Group creator is always a member
    if (isGroupCreator(group)) return true;
    // 3. User's joinedGroupIds profile array
    if (currentUser.joinedGroupIds && currentUser.joinedGroupIds.includes(group.id)) return true;
    // 4. Dedicated persistent joined groups storage
    const storedJoined = getStoredJoinedGroupIds();
    if (storedJoined.includes(group.id)) return true;
    // 5. Member UID matching (against authUid, id, and email)
    const uidsToCheck = [currentUser.authUid, currentUser.id, currentUser.email].filter(Boolean) as string[];
    if (group.memberUids && group.memberUids.length > 0) {
      if (uidsToCheck.some((uid) => group.memberUids?.includes(uid))) {
        return true;
      }
    }
    return false;
  };

  // Counts for filter pills
  const myGroupsCount = useMemo(() => {
    return groups.filter((g) => isUserMember(g)).length;
  }, [groups, currentUser]);

  const publicGroupsCount = useMemo(() => {
    return groups.filter((g) => g.privacy !== 'private').length;
  }, [groups]);

  const privateGroupsCount = useMemo(() => {
    return groups.filter((g) => g.privacy === 'private' && isUserMember(g)).length;
  }, [groups, currentUser]);

  // Filter groups:
  // 1. Privacy protection: private groups are visible only to members (creator or joined via code/link)
  // 2. Category filter (All | My Circles | Public | Private Circles)
  // 3. Subject filter
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const isPrivate = g.privacy === 'private';
      const isMember = isUserMember(g);

      // Private groups are strictly visible only to their members
      if (isPrivate && !isMember) {
        return false;
      }

      // Category filter
      if (selectedCategory === 'my-groups' && !isMember) {
        return false;
      }
      if (selectedCategory === 'public' && isPrivate) {
        return false;
      }
      if (selectedCategory === 'private' && !isPrivate) {
        return false;
      }

      // Subject filter
      if (selectedSubject !== 'All' && g.subject !== selectedSubject) {
        return false;
      }

      return true;
    });
  }, [groups, selectedCategory, selectedSubject, currentUser]);

  return (
    <div className="space-y-6">
      {/* Top Banner (Preserved Exactly as Original) */}
      <div className="bg-gradient-to-r from-stone-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 mb-1">
            <Users className="w-3.5 h-3.5" /> Peer Study Circles
          </div>
          <h2 className="text-xl font-bold">Collaborate in Accountancy & Finance Groups</h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1">
            Join or form study groups with fellow students and peers. Share trial balances, tax calculations, and case studies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenJoinCodeModal && (
            <button
              onClick={() => onOpenJoinCodeModal()}
              className="px-3.5 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-200 font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              title="Join a private group via secret code or invitation link"
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>Join with Code</span>
            </button>
          )}
          <button
            onClick={onOpenCreateGroupModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills: All Study Groups | My Circles (Joined & Led) | Public Groups | Private Circles */}
      <div className="flex items-center gap-2 flex-wrap border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          <span>All Study Groups</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
          }`}>
            {groups.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory('my-groups')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'my-groups'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60'
          }`}
          title="Study circles you have joined or created"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>My Study Circles</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedCategory === 'my-groups' ? 'bg-purple-700 text-white' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
          }`}>
            {myGroupsCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory('public')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'public'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>Public Groups</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedCategory === 'public' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
          }`}>
            {publicGroupsCount}
          </span>
        </button>

        <button
          onClick={() => setSelectedCategory('private')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'private'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-purple-500" />
          <span>Private Circles</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedCategory === 'private' ? 'bg-purple-700 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
          }`}>
            {privateGroupsCount}
          </span>
        </button>
      </div>

      {/* Subject filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {allSubjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubject === sub
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
            }`}
          >
            {sub === 'All' ? 'All Subjects' : sub}
          </button>
        ))}
      </div>

      {/* Groups Grid or Empty State */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-10 sm:p-14 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center mx-auto mb-4 border border-stone-200 dark:border-stone-700 shadow-2xs">
            <Users className="w-7 h-7" />
          </div>

          {selectedCategory === 'my-groups' ? (
            <>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                No Joined Study Circles Yet
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                You haven't joined or created any study circles yet. You can join a private group using a secret access code or join any of the open public groups.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {onOpenJoinCodeModal && (
                  <button
                    onClick={() => onOpenJoinCodeModal()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>Join with Secret Code</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Browse All Groups
                </button>
              </div>
            </>
          ) : !isLoggedIn ? (
            <>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Log in to view public study groups
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                Public study groups are visible to anyone logged into the website. Please log in to browse community groups or join with a secret code.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In / Register</span>
                  </button>
                )}
                {onOpenJoinCodeModal && (
                  <button
                    onClick={() => onOpenJoinCodeModal()}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-purple-500" />
                    <span>Join with Code</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {groups.length === 0 ? 'No study groups yet' : 'No groups found for this filter'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                {groups.length === 0
                  ? 'Be the first to start a peer study group! Form a study circle for your subject, invite classmates, and collaborate on problem solving.'
                  : 'Try choosing "All Subjects" or reset your category filter to see available groups.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  onClick={() => {
                    setSelectedSubject('All');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  onClick={onOpenCreateGroupModal}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Group</span>
                </button>
                {onOpenJoinCodeModal && (
                  <button
                    onClick={() => onOpenJoinCodeModal()}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4 text-purple-500" />
                    <span>Join with Secret Code</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const isPrivate = group.privacy === 'private';
            const isCreator = isGroupCreator(group);
            const isMember = isUserMember(group);
            const isSelected = selectedGroupId === group.id;

            return (
              <div
                key={group.id}
                id={`group-card-${group.id}`}
                className={`bg-white dark:bg-stone-900 rounded-2xl border ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30 dark:ring-blue-500/40 shadow-md'
                    : 'border-stone-200 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-600 shadow-2xs hover:shadow-md'
                } transition-all p-5 flex flex-col justify-between group/card`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl shadow-2xs">
                        {group.badgeEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {group.subject}
                          </span>
                          {isPrivate ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Private</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <span>Public</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400" />
                            <span>{group.memberCount} {group.memberCount === 1 ? 'Member' : 'Members'}</span>
                          </span>
                          {isCreator ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5 text-amber-500" />
                              <span>Host</span>
                            </span>
                          ) : isMember ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Joined</span>
                            </span>
                          ) : null}
                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                          {group.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isPrivate && isMember && onOpenInviteModal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInviteModal(group);
                          }}
                          title="Invite members / Copy secret code"
                          className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors shrink-0 cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}

                      {/* ONLY the host can edit the group name, profile, description, etc. */}
                      {isCreator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToEdit(group);
                          }}
                          title="Edit circle name, description & profile (Host only)"
                          aria-label={`Edit ${group.name}`}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors shrink-0 cursor-pointer"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}

                      {/* ONLY the host who created the group can delete that group */}
                      {isCreator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToDelete(group);
                          }}
                          title="Delete your group"
                          aria-label={`Delete ${group.name}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Others who have joined have an option to leave that group */}
                      {!isCreator && isMember && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGroupToLeave(group);
                          }}
                          title="Leave this study group"
                          aria-label={`Leave ${group.name}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4 line-clamp-3">
                    {group.description}
                  </p>

                  {group.meetingFrequency && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 mb-4">
                      <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">Sessions: {group.meetingFrequency}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupForMembers(group);
                      }}
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
                      title="View members joined in this circle"
                    >
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-800 dark:text-stone-200">{group.memberCount}</strong> members
                    </button>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-800 dark:text-stone-200">{group.materialsCount}</strong> problem sets
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 mt-2">
                  {isCreator ? (
                    <div className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                      <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>You're Host</span>
                    </div>
                  ) : isMember ? (
                    <button
                      onClick={() => setGroupToLeave(group)}
                      title="Click to leave group"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 group/leavebtn"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover/leavebtn:hidden" />
                      <LogOut className="w-3.5 h-3.5 text-rose-500 hidden group-hover/leavebtn:inline" />
                      <span className="group-hover/leavebtn:hidden">Joined</span>
                      <span className="hidden group-hover/leavebtn:inline">Leave Group</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleJoinGroup(group.id)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Join Group</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectGroup) {
                        onSelectGroup(group.id);
                      } else {
                        onSelectGroupMaterials(group.id);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
                    title={`Open ${group.name} and chat`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Group</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave Confirmation Modal (for non-creator members) */}
      {groupToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Leave Study Group?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-6 leading-relaxed">
              Are you sure you want to leave <strong className="text-stone-900 dark:text-stone-100">{groupToLeave.name}</strong>? 
              You will no longer be listed as a member of this study circle, but you can rejoin anytime.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGroupToLeave(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleJoinGroup(groupToLeave.id);
                  setGroupToLeave(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (only available to the creator) */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              Delete Study Group?
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900 dark:text-stone-100">{groupToDelete.name}</strong>? 
              As the group creator, deleting this will remove it for all members and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Edit Group Modal */}
      {groupToEdit && (
        <EditGroupModal
          isOpen={Boolean(groupToEdit)}
          onClose={() => setGroupToEdit(null)}
          group={groupToEdit}
          currentUser={currentUser}
          onUpdateGroup={(updated) => {
            onUpdateGroup?.(updated);
            setGroupToEdit(null);
          }}
        />
      )}

      {/* Group Members Modal */}
      {groupForMembers && (
        <GroupMembersModal
          isOpen={Boolean(groupForMembers)}
          onClose={() => setGroupForMembers(null)}
          group={groupForMembers}
          currentUser={currentUser}
          onOpenEditGroup={(g) => {
            setGroupForMembers(null);
            setGroupToEdit(g);
          }}
          onOpenInviteModal={onOpenInviteModal}
        />
      )}
    </div>
  );
}
