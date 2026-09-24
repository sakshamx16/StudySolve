import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  loginAsGuest 
} from '../firebase';
import { UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onAuthSuccess: (userProfile: UserProfile) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess
}: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(currentUser.name || '');
  const [gradeLevel, setGradeLevel] = useState(currentUser.gradeLevel || 'Commerce Student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const fbUser = await signInWithGoogle();
      const pName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Commerce Scholar';
      const updatedProfile: UserProfile = {
        ...currentUser,
        id: fbUser.uid,
        authUid: fbUser.uid,
        name: pName,
        email: fbUser.email || undefined,
        avatar: getStudentAvatar(pName, fbUser.photoURL || currentUser.avatar),
        isAnonymous: false,
      };
      onAuthSuccess(updatedProfile);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not yet authorized in Firebase Authentication. Please ensure "studysolve.site" and "www.studysolve.site" are added under Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by browser. Please allow popups for studysolve.site, or use Email & Password.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup was closed before completion. You can try again whenever ready.');
      } else {
        setError(err.message || 'Failed to sign in with Google. You can use Email/Password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tab === 'signin') {
        const fbUser = await loginWithEmail(email.trim(), password);
        const pName = fbUser.displayName || currentUser.name || email.split('@')[0];
        const updatedProfile: UserProfile = {
          ...currentUser,
          id: fbUser.uid,
          authUid: fbUser.uid,
          email: fbUser.email || email.trim(),
          name: pName,
          avatar: getStudentAvatar(pName, fbUser.photoURL || currentUser.avatar),
          isAnonymous: false,
        };
        onAuthSuccess(updatedProfile);
        onClose();
      } else if (tab === 'signup') {
        if (!displayName.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const fbUser = await registerWithEmail(email.trim(), password, displayName.trim());
        const updatedProfile: UserProfile = {
          ...currentUser,
          id: fbUser.uid,
          authUid: fbUser.uid,
          email: fbUser.email || email.trim(),
          name: displayName.trim(),
          avatar: getStudentAvatar(displayName.trim(), fbUser.photoURL || undefined),
          gradeLevel: gradeLevel,
          isAnonymous: false,
        };
        onAuthSuccess(updatedProfile);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Check credentials or register a new account.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please click "Sign In".');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fbUser = await loginAsGuest(displayName.trim());
      const guestName = displayName.trim() || `Guest Scholar`;
      const updatedProfile: UserProfile = {
        ...currentUser,
        id: fbUser.uid,
        authUid: fbUser.uid,
        name: guestName,
        avatar: getStudentAvatar(guestName),
        isAnonymous: true,
      };
      onAuthSuccess(updatedProfile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Liquid Glass Modal Card */}
      <div 
        className="relative bg-white/75 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.5)_inset] border border-white/60 dark:border-white/20 overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Liquid Sheen Orbs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/25 via-indigo-400/20 to-teal-300/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-cyan-400/20 via-blue-500/15 to-purple-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Liquid Glass Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600/85 via-indigo-600/85 to-slate-900/90 text-white backdrop-blur-md border-b border-white/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-full transition-colors backdrop-blur-xs border border-white/20"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-blue-100 text-[11px] font-semibold mb-2.5 backdrop-blur-md border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
            <span>Liquid Glass Security • Student Portal</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>
              {tab === 'signin' && 'Sign In with Student ID'}
              {tab === 'signup' && 'Create Your Student ID'}
              {tab === 'guest' && 'Quick Guest Student Access'}
            </span>
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 leading-relaxed">
            Collaborate across study groups, submit answers under your verified ID, and manage your questions.
          </p>

          {/* Liquid Glass Navigation Tabs */}
          <div className="flex bg-black/25 backdrop-blur-md p-1 rounded-2xl mt-4 text-xs font-semibold border border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                tab === 'signin' 
                  ? 'bg-white/95 text-blue-900 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                tab === 'signup' 
                  ? 'bg-white/95 text-blue-900 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setTab('guest'); setError(null); }}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                tab === 'guest' 
                  ? 'bg-white/95 text-blue-900 shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Guest ID
            </button>
          </div>
        </div>

        {/* Liquid Glass Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 relative z-10">
          {error && (
            <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 backdrop-blur-md border border-rose-200/80 dark:border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Google Sign-In with Liquid Glass Finish */}
          {tab !== 'guest' && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white/80 hover:bg-white text-stone-800 rounded-2xl text-xs font-bold border border-white/80 dark:border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 backdrop-blur-md disabled:opacity-50 hover:shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200/60 dark:border-stone-700/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-stone-500">
                  <span className="bg-white/80 dark:bg-stone-900/80 px-2 backdrop-blur-xs rounded-md">
                    Or with Student Email
                  </span>
                </div>
              </div>
            </div>
          )}

          {tab === 'guest' ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1.5">
                  Your Student Nickname
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. CommerceScholar24"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white font-medium outline-hidden focus:ring-2 focus:ring-blue-400/70 focus:bg-white backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  You can immediately post problems and solve peer questions. You can upgrade to a permanent ID anytime.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-[0_6px_18px_-2px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 border border-white/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Joining...' : 'Start as Guest Student'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {tab === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1">
                      Full Name / Student Handle
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Priyanshu Sharma"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white font-medium outline-hidden focus:ring-2 focus:ring-blue-400/70 focus:bg-white backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1">
                      Degree / Program
                    </label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      placeholder="e.g. B.Com Honors / CA Intermediate"
                      className="w-full text-xs px-3 py-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white font-medium outline-hidden focus:ring-2 focus:ring-blue-400/70 focus:bg-white backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white font-medium outline-hidden focus:ring-2 focus:ring-blue-400/70 focus:bg-white backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-stone-800/70 text-stone-900 dark:text-white font-medium outline-hidden focus:ring-2 focus:ring-blue-400/70 focus:bg-white backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                  />
                </div>
                {tab === 'signup' && (
                  <p className="text-[10px] text-stone-500 mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-[0_6px_18px_-2px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 border border-white/20 mt-2"
              >
                {tab === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>
                  {loading 
                    ? 'Authenticating...' 
                    : tab === 'signin' 
                      ? 'Sign In to My Account' 
                      : 'Create Student Account'}
                </span>
              </button>
            </form>
          )}

          {/* Liquid Glass Highlight Box */}
          <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/10 space-y-2 text-[11px] text-stone-700 dark:text-stone-300 bg-white/40 dark:bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/50 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
            <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>How Multi-User Study Works</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Ask in any Group:</strong> Anyone in a study group can post questions or homework doubts.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Multiple Solutions:</strong> Other students can submit their own answer under their own ID & earn points.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Delete Question?</strong> Remove any mistakenly posted question instantly with one click.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
