import { useState } from 'react';
import { 
  X, 
  Key, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  ShieldCheck, 
  Users, 
  RotateCw,
  MessageCircle,
  Lock
} from 'lucide-react';
import { StudyGroup, UserProfile } from '../types';
import { buildInviteUrl, generateSecretCode } from '../utils/groupCode';

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: StudyGroup;
  currentUser: UserProfile;
  onUpdateGroup?: (updated: StudyGroup) => void;
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateGroup,
}: InviteMembersModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const inviteUrl = buildInviteUrl(group.id, group.secretCode, group.inviteToken);
  const isCreator = group.createdByUid === (currentUser.authUid || currentUser.id) || group.leaderName === currentUser.name;
  const isPrivate = group.privacy === 'private';

  const handleCopyCode = () => {
    if (!group.secretCode) return;
    navigator.clipboard?.writeText(group.secretCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => {});
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard?.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {});
  };

  const handleRegenerateCode = () => {
    if (!onUpdateGroup || !isCreator) return;
    setIsRegenerating(true);
    const newCode = generateSecretCode(group.subject);
    const updated: StudyGroup = {
      ...group,
      secretCode: newCode,
    };
    onUpdateGroup(updated);
    setTimeout(() => setIsRegenerating(false), 300);
  };

  const shareText = isPrivate
    ? `Join our private study circle "${group.name}" on StudySolve! Secret Access Code: ${group.secretCode}\nDirect Link: ${inviteUrl}`
    : `Join our study group "${group.name}" on StudySolve!\nLink: ${inviteUrl}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Invitation to join study group: ${group.name}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou are invited to join our study group "${group.name}" on StudySolve.\n\n` +
      (isPrivate ? `Secret Access Code: ${group.secretCode}\n` : '') +
      `Join directly here: ${inviteUrl}\n\nHappy studying!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isPrivate 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
            }`}>
              {isPrivate ? <Lock className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Invite Members to Study Group
              </h2>
              <p className="text-[11px] text-stone-400">
                {isPrivate ? 'Share the secret code or link to grant private access' : 'Invite classmates to collaborate and study together'}
              </p>
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
        <div className="p-6 space-y-5">
          
          {/* Group Identity Card */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-2xl shadow-2xs">
                {group.badgeEmoji || '📚'}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {group.subject}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isPrivate 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isPrivate ? '🔒 Private Circle' : '🌐 Public Group'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Users className="w-2.5 h-2.5 text-stone-500" />
                    <span>{group.memberCount} {group.memberCount === 1 ? 'Member' : 'Members'}</span>
                  </span>
                </div>
                <h3 className="font-bold text-sm text-stone-900 mt-1">
                  {group.name}
                </h3>
              </div>
            </div>

            <div className="text-right text-xs text-stone-500 hidden sm:block">
              <div><strong className="text-stone-900">{group.memberCount}</strong> members</div>
              <div className="text-[11px]">Led by {group.leaderName}</div>
            </div>
          </div>

          {/* Section 1: Secret Access Code (for Private Groups) */}
          {isPrivate && group.secretCode && (
            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Secret Access Code</span>
                </label>
                {isCreator && onUpdateGroup && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    disabled={isRegenerating}
                    className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Change the secret code"
                  >
                    <RotateCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate Code</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white font-mono text-xl sm:text-2xl font-black tracking-widest text-purple-950 px-4 py-2.5 rounded-xl border border-purple-200 text-center shadow-2xs select-all">
                  {group.secretCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                    copiedCode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-purple-900/80">
                Classmates can enter this code in the <strong>"Join with Secret Code"</strong> modal to join this private circle.
              </p>
            </div>
          )}

          {/* Section 2: Direct Invitation Link */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span>Direct Invitation Link</span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-stone-900 hover:bg-stone-800 text-white border-transparent'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied Link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              When opened, this link automatically navigates to this study group {isPrivate ? 'and applies the access code' : ''}.
            </p>
          </div>

          {/* Section 3: Instant Share Buttons (WhatsApp & Email) */}
          <div className="pt-2 border-t border-stone-100">
            <p className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2.5">
              Quick Share
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Share via WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleShareEmail}
                className="py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4 text-stone-600" />
                <span>Share via Email</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-stone-400" />
            {isPrivate
              ? 'Only users with the secret code or invitation link can view problem sets and questions in this group.'
              : 'This is a public group visible to all logged-in students across StudySolve.'}
          </div>
        </div>
      </div>
    </div>
  );
}
