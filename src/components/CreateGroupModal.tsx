import { useState } from 'react';
import { X, Sparkles, Users } from 'lucide-react';
import { StudyGroup, Subject, UserProfile } from '../types';

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

const EMOJI_OPTIONS = ['📊', '📑', '⚖️', '📈', '💰', '🏛️', '💼', '🧮', '🔍', '📚'];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onAddGroup,
  currentUser,
}: CreateGroupModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [subject, setSubject] = useState<Subject>('Financial Accounting');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [description, setDescription] = useState('');
  const [badgeEmoji, setBadgeEmoji] = useState('📊');
  const [meetingFrequency, setMeetingFrequency] = useState('Tuesdays & Thursdays, 7 PM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSubject: Subject = isCustomSubject
      ? (customSubjectText.trim() || 'General Subject')
      : subject;

    const newGroup: StudyGroup = {
      id: `grp-${Date.now()}`,
      name: name.trim(),
      subject: finalSubject,
      description: description.trim() || `Collaborative study and homework problem solving for ${name.trim()}.`,
      memberCount: 1,
      materialsCount: 0,
      badgeEmoji,
      accentColor: '#3b82f6',
      isJoined: true,
      meetingFrequency,
      leaderName: currentUser.name || 'Peer Mentor',
      createdByUid: currentUser.authUid || currentUser.id,
      createdAt: 'Just now',
    };

    onAddGroup(newGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Create New Study Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
              Group Name
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
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold transition-colors"
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
                    className={`p-1.5 rounded-lg text-lg hover:bg-stone-100 ${
                      badgeEmoji === emoji ? 'bg-blue-100 ring-1 ring-blue-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

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

          <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Study Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
