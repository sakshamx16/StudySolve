import { useState } from 'react';
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
  LogIn
} from 'lucide-react';
import { StudyGroup, Subject, UserProfile } from '../types';

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
}: StudyGroupsListProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'All'>('All');
  const [groupToDelete, setGroupToDelete] = useState<StudyGroup | null>(null);

  const isLoggedIn = Boolean(
    currentUser.name && 
    currentUser.id !== 'guest' && 
    !currentUser.isAnonymous
  );

  const allSubjects = Array.from(
    new Set([
      ...subjects,
      ...groups.map((g) => g.subject).filter((s) => s && s.trim().length > 0),
    ])
  );

  const isUserMember = (group: StudyGroup): boolean => {
    if (group.isJoined) return true;
    if (currentUser.joinedGroupIds?.includes(group.id)) return true;
    const currentUid = currentUser.authUid || currentUser.id;
    if (group.createdByUid && group.createdByUid === currentUid) return true;
    if (group.memberUids?.includes(currentUid)) return true;
    return false;
  };

  // Filter groups:
  // 1. Subject filter
  // 2. Public groups are visible to anyone who has logged in into the website
  // 3. Private groups are visible to their members (peoples are added via secret code or invitation link)
  const filteredGroups = groups.filter((g) => {
    if (selectedSubject !== 'All' && g.subject !== selectedSubject) {
      return false;
    }

    const isPrivate = g.privacy === 'private';
    const isMember = isUserMember(g);

    // If not logged in, public groups are not visible
    if (!isLoggedIn) {
      return false;
    }

    // In private groups, only members who have been added through code or link can see them
    if (isPrivate && !isMember) {
      return false;
    }

    return true;
  });

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

      {/* Subject filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {allSubjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubject === sub
                ? 'bg-stone-900 text-white font-semibold'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
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

          {!isLoggedIn ? (
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
                {groups.length === 0 ? 'No study groups yet' : 'No groups found for this subject'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                {groups.length === 0
                  ? 'Be the first to start a peer study group! Form a study circle for your subject, invite classmates, and collaborate on problem solving.'
                  : 'Try choosing "All Subjects" or create a new dedicated group for this subject.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
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
            const isMember = isUserMember(group);

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-600 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group/card"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-2xl shadow-2xs">
                        {group.badgeEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                            {group.subject}
                          </span>
                          {isPrivate && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Private</span>
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToDelete(group);
                        }}
                        title="Delete group"
                        aria-label={`Delete ${group.name}`}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0 opacity-80 hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-800 dark:text-stone-200">{group.memberCount}</strong> members
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                      <strong className="text-stone-800 dark:text-stone-200">{group.materialsCount}</strong> problem sets
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => onToggleJoinGroup(group.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      isMember
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    {isMember ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Joined</span>
                      </>
                    ) : (
                      <span>+ Join Group</span>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectGroupMaterials(group.id)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Problems</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              This will remove this group from your active study circles.
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
    </div>
  );
}
