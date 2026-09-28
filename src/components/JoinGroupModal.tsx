import { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Lock, 
  Unlock, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Link as LinkIcon,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyGroup, UserProfile } from '../types';
import { parseInviteParams } from '../utils/groupCode';
import { lookupSharedGroupFromApi } from '../utils/storage';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: StudyGroup[];
  onJoinGroup: (group: StudyGroup) => void;
  currentUser: UserProfile;
  initialCode?: string;
  initialGroupId?: string;
  onOpenAuthModal?: () => void;
}

export default function JoinGroupModal({
  isOpen,
  onClose,
  groups,
  onJoinGroup,
  currentUser,
  initialCode = '',
  initialGroupId = '',
  onOpenAuthModal,
}: JoinGroupModalProps) {
  const [inputVal, setInputVal] = useState(initialCode);
  const [errorMsg, setErrorMsg] = useState('');
  const [successGroup, setSuccessGroup] = useState<StudyGroup | null>(null);
  const [serverPreviewGroup, setServerPreviewGroup] = useState<StudyGroup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial values
  useEffect(() => {
    if (initialCode) {
      setInputVal(initialCode);
    }
  }, [initialCode]);

  // Clean state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessGroup(null);
      setServerPreviewGroup(null);
      setIsSubmitting(false);
      if (initialCode) {
        setInputVal(initialCode);
      }
    }
  }, [isOpen, initialCode]);

  const isLoggedIn = Boolean(
    currentUser.name && 
    currentUser.id !== 'guest' && 
    !currentUser.isAnonymous
  );

  // Extract clean code or token if user pasted a full URL
  const extractCodeOrToken = (raw: string): { code: string; token: string; targetGroupId: string } => {
    const trimmed = raw.trim();
    if (trimmed.includes('?') || trimmed.includes('joinGroup=') || trimmed.includes('code=')) {
      const parsed = parseInviteParams(trimmed);
      return {
        code: (parsed.code || '').toUpperCase().trim(),
        token: (parsed.invite || '').trim(),
        targetGroupId: (parsed.groupId || '').trim(),
      };
    }
    return {
      code: trimmed.toUpperCase(),
      token: trimmed,
      targetGroupId: initialGroupId || '',
    };
  };

  // Find candidate group matching the code, token, or ID (robust normalized matching)
  const findMatchingGroup = (raw: string): StudyGroup | null => {
    const { code, token, targetGroupId } = extractCodeOrToken(raw);
    if (!code && !token && !targetGroupId) return null;

    const cleanInput = code.replace(/[^A-Z0-9]/g, '');
    const cleanDigits = code.replace(/[^0-9]/g, '');

    return groups.find((g) => {
      const gCode = (g.secretCode || '').toUpperCase().trim();
      const cleanGCode = gCode.replace(/[^A-Z0-9]/g, '');
      const cleanGDigits = gCode.replace(/[^0-9]/g, '');

      // 1. Direct or normalized match on secretCode (e.g. "ACCT-7429", "acct-7429", "ACCT7429")
      if (code && gCode) {
        if (code === gCode || (cleanInput && cleanGCode && cleanInput === cleanGCode)) {
          return true;
        }
        // Match 4-digit code if user only typed numbers
        if (cleanDigits.length >= 4 && cleanDigits === cleanGDigits) {
          return true;
        }
      }

      // 2. Direct match on inviteToken
      if (token && g.inviteToken && g.inviteToken.trim() === token.trim()) {
        return true;
      }

      // 3. Match on groupId + code
      if (targetGroupId && g.id === targetGroupId) {
        if (!g.secretCode || !code || code === gCode || cleanInput === cleanGCode) {
          return true;
        }
      }
      return false;
    }) || null;
  };

  const localPreview = inputVal.trim() ? findMatchingGroup(inputVal) : null;
  const previewGroup = localPreview || serverPreviewGroup;

  // Lightweight async lookup for preview when user finishes typing a valid code
  useEffect(() => {
    const trimmed = inputVal.trim();
    if (!trimmed || localPreview) {
      setServerPreviewGroup(null);
      return;
    }

    const { code, token, targetGroupId } = extractCodeOrToken(trimmed);
    if (code.length >= 4 || token.length >= 4 || targetGroupId) {
      const timer = setTimeout(() => {
        lookupSharedGroupFromApi(code, token, targetGroupId).then((res) => {
          if (res) {
            setServerPreviewGroup(res);
            setErrorMsg('');
          }
        }).catch(() => {});
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [inputVal, localPreview]);

  const isAlreadyMember = previewGroup ? (
    previewGroup.isJoined || 
    currentUser.joinedGroupIds.includes(previewGroup.id) ||
    previewGroup.createdByUid === (currentUser.authUid || currentUser.id) ||
    previewGroup.memberUids?.includes(currentUser.authUid || currentUser.id)
  ) : false;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isLoggedIn) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    setIsSubmitting(true);
    let matched = findMatchingGroup(inputVal) || serverPreviewGroup;

    // If not found in local memory, lookup from shared server API
    if (!matched) {
      const { code, token, targetGroupId } = extractCodeOrToken(inputVal);
      try {
        const serverMatched = await lookupSharedGroupFromApi(code, token, targetGroupId);
        if (serverMatched) {
          matched = serverMatched;
        }
      } catch {
        // Fallback
      }
    }

    if (!matched) {
      setIsSubmitting(false);
      setErrorMsg('No private study group found matching this secret code or invite link. Please check with your study group leader.');
      return;
    }

    if (isAlreadyMember) {
      setIsSubmitting(false);
      setSuccessGroup(matched);
      return;
    }

    // Join group!
    onJoinGroup(matched);
    setSuccessGroup(matched);
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Join Private Study Group</h2>
              <p className="text-[11px] text-stone-400">Unlock restricted circles with a secret code or invite link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Guest Warning if not logged in */}
          {!isLoggedIn && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Student Login Required</p>
                <p className="mt-0.5 text-stone-600">
                  Please sign in or register with your student name to join private study circles and save your problem sets.
                </p>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="mt-2 text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Log In / Register Student ID</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {successGroup ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto text-2xl shadow-xs animate-bounce">
                {successGroup.badgeEmoji || '🎉'}
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] uppercase tracking-wider">
                  {isAlreadyMember ? 'Already Member' : 'Successfully Joined!'}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  {successGroup.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Subject: {successGroup.subject} • Led by {successGroup.leaderName}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 max-w-sm mx-auto">
                <p>
                  You now have full access to this private study circle. You can view all problem sets, ask questions, and collaborate on solutions.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Enter Study Circle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Secret Access Code or Invitation Link
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => {
                      setInputVal(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. ACCT-4829 or paste invitation link..."
                    className="w-full pl-3.5 pr-10 py-3 rounded-xl border border-stone-200 focus:border-purple-600 text-sm font-mono uppercase tracking-wide outline-none bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all"
                    required
                    autoFocus
                  />
                  <Key className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  Enter the 6-8 digit code provided by your peer or paste the full invitation link.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Live Preview Card when code matches */}
              {previewGroup && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-left space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Group Found & Verified</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-[10px] font-semibold">
                      🔒 Private Circle
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-xl shadow-2xs shrink-0">
                      {previewGroup.badgeEmoji || '📚'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                        {previewGroup.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {previewGroup.subject} • {previewGroup.memberCount} members
                      </p>
                    </div>
                  </div>

                  {isAlreadyMember && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 pt-1 border-t border-purple-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>You are already a member of this study circle!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition-all ${
                    !inputVal.trim() || isSubmitting
                      ? 'bg-stone-300 cursor-not-allowed'
                      : isAlreadyMember
                      ? 'bg-stone-900 hover:bg-stone-800'
                      : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : isAlreadyMember ? (
                    <>
                      <span>Open Study Circle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock & Join Group</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
