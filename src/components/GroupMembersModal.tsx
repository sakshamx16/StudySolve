import { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Crown, 
  Key, 
  Copy, 
  Check, 
  ShieldCheck, 
  Settings, 
  Share2, 
  UserCheck, 
  BookOpen, 
  Calendar 
} from 'lucide-react';
import { StudyGroup, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';
import { isRealGroupHost } from '../utils/storage';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: StudyGroup;
  currentUser: UserProfile;
  onOpenEditGroup?: (group: StudyGroup) => void;
  onOpenInviteModal?: (group: StudyGroup) => void;
}

interface MemberDetail {
  uid: string;
  name: string;
  avatar?: string;
  role: 'host' | 'member';
  gradeLevel?: string;
  joinedAt?: string;
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onOpenEditGroup,
  onOpenInviteModal,
}: GroupMembersModalProps) {
  const isHost = isRealGroupHost(group, currentUser);
  const [members, setMembers] = useState<MemberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!isOpen || !group) return;

    setLoading(true);
    fetch(`/api/groups/${encodeURIComponent(group.id)}/members`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.members) && data.members.length > 0) {
          setMembers(data.members);
        } else {
          // Fallback based on group memberUids
          const uids = group.memberUids || [];
          const fallbackList: MemberDetail[] = [];

          // Always add host
          fallbackList.push({
            uid: group.createdByUid || 'host-1',
            name: group.leaderName || 'Circle Host',
            role: 'host',
            gradeLevel: 'Peer Mentor / Host',
            joinedAt: 'Founder',
          });

          // Add other member UIDs
          uids.forEach((uid, index) => {
            if (uid !== group.createdByUid) {
              const isCurrentUser = uid === currentUser.authUid || uid === currentUser.id;
              fallbackList.push({
                uid,
                name: isCurrentUser ? (currentUser.name || 'You') : `Student Member ${index + 1}`,
                avatar: isCurrentUser ? currentUser.avatar : '',
                role: 'member',
                gradeLevel: isCurrentUser ? currentUser.gradeLevel : 'Commerce Student',
                joinedAt: 'Active peer',
              });
            }
          });

          setMembers(fallbackList);
        }
      })
      .catch(() => {
        // Fallback
        setMembers([
          {
            uid: group.createdByUid || 'host-1',
            name: group.leaderName || 'Circle Host',
            role: 'host',
            gradeLevel: 'Host / Founder',
            joinedAt: 'Founder',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, group, currentUser]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!group.secretCode) return;
    navigator.clipboard.writeText(group.secretCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const hostMember = members.find((m) => m.role === 'host') || {
    uid: group.createdByUid || 'host',
    name: group.leaderName || 'Group Host',
    role: 'host' as const,
    gradeLevel: 'Circle Founder',
  };

  const regularMembers = members.filter((m) => m.role !== 'host');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl shadow-xs">
              {group.badgeEmoji || '📚'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">{group.name}</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {members.length || group.memberCount} Members
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {group.subject} • {group.privacy === 'private' ? '🔒 Private Circle' : '🌐 Public Circle'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Host Special Showcase Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900/60 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Circle Host & Founder</span>
              </span>
              {isHost && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  You are the Host
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <img
                src={getStudentAvatar(hostMember.name, hostMember.avatar)}
                alt={hostMember.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400/50 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                  {hostMember.name}
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  {hostMember.gradeLevel || 'Circle Founder'}
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Host manages circle settings, invites peers, and moderates questions.
                </p>
              </div>

              {isHost && onOpenEditGroup && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditGroup(group);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 font-semibold flex items-center gap-1 text-[11px] shadow-2xs transition-colors shrink-0"
                  title="Edit Group Info"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Circle</span>
                </button>
              )}
            </div>
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-stone-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Enrolled Peer Members ({regularMembers.length})</span>
              </h4>
              {onOpenInviteModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInviteModal(group);
                  }}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Share2 className="w-3 h-3" />
                  <span>+ Invite Peers</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6 text-center text-stone-400">Loading circle members...</div>
            ) : regularMembers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-center space-y-2">
                <UserCheck className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="font-semibold text-stone-700 dark:text-stone-300">
                  No other members have joined yet
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                  {group.privacy === 'private'
                    ? 'Share your secret circle code with your friends or classmates to study together!'
                    : 'This public circle is ready for students to join.'}
                </p>
                {group.secretCode && (
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <span className="font-mono font-bold bg-white dark:bg-stone-900 px-3 py-1 rounded-lg border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                      {group.secretCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 text-[11px]"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {regularMembers.map((member, idx) => {
                  const isCurrentUser =
                    member.uid === currentUser.authUid ||
                    member.uid === currentUser.id ||
                    (currentUser.name && member.name === currentUser.name);

                  return (
                    <div
                      key={member.uid || idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        isCurrentUser
                          ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60'
                          : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={getStudentAvatar(member.name, member.avatar)}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                            {member.gradeLevel || 'Active Peer Student'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        Joined
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <span>Active Peer Circle</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold hover:bg-stone-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
