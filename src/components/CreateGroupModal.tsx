import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Users, 
  Globe, 
  Lock, 
  Key, 
  RotateCw, 
  Link as LinkIcon, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { StudyGroup, Subject, UserProfile, GroupPrivacy } from '../types';
import { generateSecretCode, generateInviteToken, buildInviteUrl } from '../utils/groupCode';
import { getOrCreateClientUid } from '../utils/storage';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGroup: (newGroup: StudyGroup) => void;
  currentUser: UserProfile;
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

const EMOJI_OPTIONS = ['📊', '📑', '⚖️', '📈', '💰', '🏛️', '💼', '🧮', '🔍', '📚', '🎯', '💡'];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onAddGroup,
  currentUser,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState<Subject>('Financial Accounting');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [description, setDescription] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('📊');
  const [meetingFrequency, setMeetingFrequency] = useState('Tuesdays & Thursdays, 7 PM');
  
  // Privacy options
  const [privacy, setPrivacy] = useState<GroupPrivacy>('public');
  const [secretCode, setSecretCode] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize or regenerate code when switching to private or changing subject
  useEffect(() => {
    if (privacy === 'private' && !secretCode) {
      const activeSub = isCustomSubject ? customSubjectText : subject;
      setSecretCode(generateSecretCode(activeSub));
      setInviteToken(generateInviteToken());
    }
  }, [privacy, subject, isCustomSubject, customSubjectText, secretCode]);

  const handleRegenerateCode = () => {
    const activeSub = isCustomSubject ? customSubjectText : subject;
    setSecretCode(generateSecretCode(activeSub));
    setInviteToken(generateInviteToken());
  };

  const handleCopyPreviewLink = () => {
    // Generate temporary preview URL
    const tempId = `grp-${Date.now()}`;
    const url = buildInviteUrl(tempId, secretCode, inviteToken);
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSubject: Subject = isCustomSubject
      ? (customSubjectText.trim() || 'General Subject')
      : subject;

    const currentUid = currentUser.authUid || (currentUser.id && currentUser.id !== 'guest' ? currentUser.id : getOrCreateClientUid());
    const finalGroupId = `grp-${Date.now()}`;
    const finalSecretCode = privacy === 'private' 
      ? (secretCode.trim().toUpperCase() || generateSecretCode(finalSubject))
      : '';
    const finalInviteToken = privacy === 'private'
      ? (inviteToken || generateInviteToken())
      : '';

    const newGroup: StudyGroup = {
      id: finalGroupId,
      name: name.trim(),
      subject: finalSubject,
      description: description.trim() || `Collaborative study and homework problem solving for ${name.trim()}.`,
      memberCount: 1,
      materialsCount: 0,
      badgeEmoji,
      accentColor: privacy === 'private' ? '#8b5cf6' : '#3b82f6',
      isJoined: true,
      meetingFrequency: meetingFrequency || 'Flexible weekly sessions',
      leaderName: currentUser.name || 'Peer Mentor',
      createdByUid: currentUid,
      createdAt: 'Just now',
      privacy,
      secretCode: finalSecretCode,
      inviteToken: finalInviteToken,
      memberUids: currentUid ? [currentUid] : [],
    };

    onAddGroup(newGroup);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Create New Study Group</h2>
              <p className="text-[11px] text-stone-400">Collaborate with peers, ask questions, and share solutions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* STEP 1: Privacy Option (Public vs Private) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              Group Type & Privacy <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Public Group */}
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  privacy === 'public'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        privacy === 'public' ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-stone-900 text-sm">Public Group</span>
                    </div>
                    {privacy === 'public' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Visible to anyone logged into the website. Any student can freely discover and join.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Open Community Access</span>
                </div>
              </button>

              {/* Option 2: Private Group */}
              <button
                type="button"
                onClick={() => {
                  setPrivacy('private');
                  if (!secretCode) {
                    const activeSub = isCustomSubject ? customSubjectText : subject;
                    setSecretCode(generateSecretCode(activeSub));
                    setInviteToken(generateInviteToken());
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  privacy === 'private'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        privacy === 'private' ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-stone-900 text-sm">Private Group</span>
                    </div>
                    {privacy === 'private' && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Restricted circle. Students can only be added through a Secret Code or Invitation Link.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Code & Link Protected</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Box: Private Group Secret Code & Link Preview */}
          {privacy === 'private' && (
            <div className="p-4 bg-gradient-to-br from-purple-50 via-indigo-50/40 to-stone-50 rounded-2xl border border-purple-200 shadow-2xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wide">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Group Secret Access Code</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer"
                  title="Generate a different random code"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Regenerate Code</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. ACCT-4829"
                    className="w-full font-mono text-base font-extrabold tracking-wider px-3.5 py-2.5 rounded-xl border-2 border-purple-300 bg-white text-purple-950 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-200 uppercase"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-500 uppercase">
                    Secret Code
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-purple-100 text-xs text-purple-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1 text-[11px] text-purple-900">
                    <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
                    <span>Direct Invitation Link</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPreviewLink}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <span>Copy Link</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">
                  After creating this group, classmates can join instantly using this Secret Code (<strong className="font-mono text-purple-900">{secretCode || 'CODE'}</strong>) or clicking your invitation link.
                </p>
              </div>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Auditing & Corporate Governance Squad"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* Subject & Badge Emoji */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Subject {isCustomSubject && <span className="text-blue-600 font-semibold">(Manual)</span>}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomSubject(!isCustomSubject);
                    if (!isCustomSubject && !customSubjectText) {
                      setCustomSubjectText('');
                    }
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                >
                  {isCustomSubject ? '← Pick from list' : '✏️ Enter manually'}
                </button>
              </div>

              {isCustomSubject ? (
                <input
                  type="text"
                  value={customSubjectText}
                  onChange={(e) => setCustomSubjectText(e.target.value)}
                  placeholder="e.g. Econometrics, Forensic Accounting..."
                  className="w-full text-xs p-2.5 rounded-xl border-2 border-blue-500 bg-blue-50/20 text-stone-900 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                  required
                  autoFocus
                />
              ) : (
                <select
                  value={subject}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomSubject(true);
                    } else {
                      setSubject(e.target.value as Subject);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-medium outline-none focus:border-blue-500"
                >
                  {STANDARD_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__custom__">✏️ Enter subject manually...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                Badge Icon
              </label>
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setBadgeEmoji(emoji)}
                    className={`p-1.5 rounded-lg text-lg hover:bg-stone-100 cursor-pointer ${
                      badgeEmoji === emoji ? 'bg-blue-100 ring-1 ring-blue-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description & Focus Areas */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Description & Focus Areas
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problems, classes, or goals will this study group tackle together?"
              rows={3}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* Study Rhythm */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Study Rhythm / Online Sessions
            </label>
            <input
              type="text"
              value={meetingFrequency}
              onChange={(e) => setMeetingFrequency(e.target.value)}
              placeholder="e.g. Tuesdays & Thursdays, 7 PM"
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                privacy === 'private'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{privacy === 'private' ? 'Create Private Study Circle' : 'Launch Public Study Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
