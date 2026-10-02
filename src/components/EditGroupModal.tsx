import { useState, useEffect, FormEvent } from 'react';
import { 
  X, 
  Crown, 
  Settings, 
  BookOpen, 
  Calendar, 
  Lock, 
  Globe, 
  Sparkles, 
  Save, 
  RefreshCw, 
  AlertCircle,
  ShieldCheck 
} from 'lucide-react';
import { StudyGroup, Subject, GroupPrivacy, UserProfile } from '../types';
import { generateSecretCode, generateInviteToken } from '../utils/groupCode';
import { isRealGroupHost } from '../utils/storage';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: StudyGroup;
  currentUser: UserProfile;
  onUpdateGroup: (updatedGroup: StudyGroup) => void;
}

const STANDARD_SUBJECTS: Subject[] = [
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

const EMOJI_OPTIONS = ['📊', '📑', '⚖️', '📈', '💰', '🏛️', '💼', '🧮', '🔍', '📚', '🎯', '💡', '🎓', '📝', '⚡'];

export default function EditGroupModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateGroup,
}: EditGroupModalProps) {
  const isHost = isRealGroupHost(group, currentUser);

  const [name, setName] = useState(group.name);
  const [subject, setSubject] = useState<Subject>(group.subject);
  const [isCustomSubject, setIsCustomSubject] = useState(
    !STANDARD_SUBJECTS.includes(group.subject as any)
  );
  const [customSubjectText, setCustomSubjectText] = useState(
    !STANDARD_SUBJECTS.includes(group.subject as any) ? group.subject : ''
  );
  const [description, setDescription] = useState(group.description);
  const [badgeEmoji, setBadgeEmoji] = useState(group.badgeEmoji || '📚');
  const [meetingFrequency, setMeetingFrequency] = useState(group.meetingFrequency || 'Flexible weekly sessions');
  const [privacy, setPrivacy] = useState<GroupPrivacy>(group.privacy || 'public');
  const [secretCode, setSecretCode] = useState(group.secretCode || '');
  const [inviteToken, setInviteToken] = useState(group.inviteToken || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever group changes
  useEffect(() => {
    if (group) {
      setName(group.name);
      setSubject(group.subject);
      const isCustom = !STANDARD_SUBJECTS.includes(group.subject as any);
      setIsCustomSubject(isCustom);
      setCustomSubjectText(isCustom ? group.subject : '');
      setDescription(group.description);
      setBadgeEmoji(group.badgeEmoji || '📚');
      setMeetingFrequency(group.meetingFrequency || 'Flexible weekly sessions');
      setPrivacy(group.privacy || 'public');
      setSecretCode(group.secretCode || '');
      setInviteToken(group.inviteToken || '');
      setErrorMessage(null);
    }
  }, [group]);

  if (!isOpen) return null;

  const handleRegenerateCode = () => {
    const newCode = generateSecretCode(isCustomSubject ? customSubjectText : subject);
    const newToken = generateInviteToken();
    setSecretCode(newCode);
    setInviteToken(newToken);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isHost) {
      setErrorMessage("Only the group Host has permission to modify this circle's settings.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Please enter a group name.');
      return;
    }

    const finalSubject: Subject = isCustomSubject
      ? (customSubjectText.trim() || 'General Subject')
      : subject;

    let finalSecretCode = secretCode;
    let finalInviteToken = inviteToken;

    if (privacy === 'private' && !finalSecretCode) {
      finalSecretCode = generateSecretCode(finalSubject);
      finalInviteToken = generateInviteToken();
    }

    setIsSaving(true);
    setErrorMessage(null);

    const updated: StudyGroup = {
      ...group,
      name: name.trim(),
      subject: finalSubject,
      description: description.trim() || `Collaborative study group for ${name.trim()}`,
      badgeEmoji,
      meetingFrequency: meetingFrequency.trim() || 'Flexible sessions',
      privacy,
      secretCode: privacy === 'private' ? finalSecretCode : '',
      inviteToken: privacy === 'private' ? finalInviteToken : '',
      accentColor: privacy === 'private' ? '#8b5cf6' : '#3b82f6',
    };

    try {
      await onUpdateGroup(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save group changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white leading-tight">Edit Group Settings</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Host Only
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Update name, emoji badge, description, and privacy for {group.name}
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

        {/* Non-host warning guard */}
        {!isHost && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Host Permissions Required</p>
              <p className="mt-0.5">
                Only the official host who created this circle ({group.leaderName}) can edit its settings.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Group Name & Emoji Badge */}
          <div className="space-y-2">
            <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>Circle Name & Icon</span>
              <span className="text-[11px] font-normal text-stone-400">Required</span>
            </label>
            <div className="flex gap-2">
              <div className="w-12 h-11 rounded-xl border border-stone-300 dark:border-stone-700 flex items-center justify-center text-2xl shrink-0 bg-stone-50 dark:bg-stone-800">
                {badgeEmoji}
              </div>
              <input
                type="text"
                disabled={!isHost || isSaving}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CA Final Auditing Masters"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:opacity-50"
                required
              />
            </div>

            {/* Quick Emoji Swatches */}
            {isHost && (
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-stone-400 mr-1">Choose icon:</span>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setBadgeEmoji(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                      badgeEmoji === emoji
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 scale-110 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>Academic Subject</span>
              <button
                type="button"
                onClick={() => setIsCustomSubject(!isCustomSubject)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                {isCustomSubject ? 'Choose from list' : '+ Custom subject'}
              </button>
            </label>

            {isCustomSubject ? (
              <input
                type="text"
                disabled={!isHost || isSaving}
                value={customSubjectText}
                onChange={(e) => setCustomSubjectText(e.target.value)}
                placeholder="e.g. Advanced Auditing / US GAAP"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            ) : (
              <select
                disabled={!isHost || isSaving}
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {STANDARD_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>Circle Description & Goals</span>
              <span className="text-[11px] font-normal text-stone-400">Optional</span>
            </label>
            <textarea
              rows={3}
              disabled={!isHost || isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problems does this group focus on? (e.g. Daily case laws, ledger practice, amendments discussion)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Meeting Schedule */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Study Session Schedule</span>
            </label>
            <input
              type="text"
              disabled={!isHost || isSaving}
              value={meetingFrequency}
              onChange={(e) => setMeetingFrequency(e.target.value)}
              placeholder="e.g. Saturdays & Sundays, 8:00 PM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Privacy Settings (Public vs Private) */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label className="font-bold text-stone-800 dark:text-stone-200">
              Privacy & Access Control
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={!isHost || isSaving}
                onClick={() => setPrivacy('public')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  privacy === 'public'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 ring-2 ring-blue-500/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-white mb-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>🌐 Public Circle</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  Anyone can discover and join this group freely.
                </p>
              </button>

              <button
                type="button"
                disabled={!isHost || isSaving}
                onClick={() => {
                  setPrivacy('private');
                  if (!secretCode) handleRegenerateCode();
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  privacy === 'private'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/60 ring-2 ring-purple-500/20'
                    : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-white mb-1">
                  <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>🔒 Private Circle</span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  Protected: only accessible with your secret code.
                </p>
              </button>
            </div>

            {/* Secret Code Display & Regeneration if Private */}
            {privacy === 'private' && (
              <div className="mt-3 p-3.5 bg-purple-50 dark:bg-purple-950/50 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Secret Join Code</span>
                  </span>
                  {isHost && (
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Code</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={secretCode}
                    className="w-full font-mono text-center text-sm font-bold tracking-widest bg-white dark:bg-stone-900 text-purple-900 dark:text-purple-200 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 select-all"
                  />
                </div>
                <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                  Share this code with your study buddies so they can enter this group from their dashboard.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isHost || isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Circle Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
