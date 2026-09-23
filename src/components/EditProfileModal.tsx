import React, { useState, useRef } from 'react';
import { 
  X, 
  User, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Trash2,
  Camera,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
}

// Curated student avatars (diverse styles, academic, professional, and friendly)
export const PRESET_AVATARS = [
  {
    id: 'avatar-1',
    label: 'Scholar (Female)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-2',
    label: 'Analyst (Male)',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-3',
    label: 'Accountant (Glasses)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-4',
    label: 'Graduate (Female)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-5',
    label: 'Researcher (Male)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-6',
    label: 'Finance Student (Female)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-7',
    label: 'Auditor (Male)',
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-8',
    label: 'Economist (Female)',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-9',
    label: 'Study Lead (Male)',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-10',
    label: 'Honours Scholar (Female)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-11',
    label: 'Campus Fellow (Male)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
  },
  {
    id: 'avatar-12',
    label: 'Peer Solver (Female)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  },
];

// Quick suggested courses for one-click addition
const SUGGESTED_COURSES = [
  'Financial Accounting',
  'Cost Accounting',
  'Taxation & GST',
  'Corporate Law',
  'Macroeconomics',
  'Microeconomics',
  'Financial Management',
  'Auditing',
  'Business Statistics',
];

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}: EditProfileModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [gradeLevel, setGradeLevel] = useState(currentUser.gradeLevel || 'Undergraduate Student (B.Com / CA Aspirant)');
  const [courses, setCourses] = useState<string[]>(
    currentUser.courses && currentUser.courses.length > 0
      ? currentUser.courses
      : ['Financial Accounting', 'Corporate Law', 'Direct Taxation']
  );
  const [bio, setBio] = useState(currentUser.bio || '');
  const [newCourseInput, setNewCourseInput] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [avatarMode, setAvatarMode] = useState<'preset' | 'custom'>('preset');
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload (profile picture)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add course to list
  const handleAddCourse = (courseName?: string) => {
    const toAdd = (courseName || newCourseInput).trim();
    if (toAdd && !courses.includes(toAdd)) {
      setCourses([...courses, toAdd]);
      if (!courseName) setNewCourseInput('');
    }
  };

  // Remove course from list
  const handleRemoveCourse = (courseToRemove: string) => {
    setCourses(courses.filter((c) => c !== courseToRemove));
  };

  // Apply custom URL
  const handleApplyCustomUrl = () => {
    if (customImageUrl.trim()) {
      setAvatar(customImageUrl.trim());
      setCustomImageUrl('');
    }
  };

  // Submit profile changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim(),
      avatar,
      gradeLevel: gradeLevel.trim(),
      courses,
      bio: bio.trim(),
    };

    onUpdateUser(updated);
    setIsSaved(true);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Edit Student Profile</h2>
              <p className="text-xs text-stone-300">
                Update your name, profile picture, avatar, and enrolled courses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-r from-stone-50 to-blue-50/40 p-4 sm:p-5 border-b border-stone-200/80 shrink-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Live Profile Card Preview
          </div>
          <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="relative shrink-0">
              <img
                src={getStudentAvatar(name, avatar)}
                alt={name || 'Student'}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-500/30 shadow-2xs aspect-square"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getStudentAvatar(name);
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-stone-900 truncate">
                  {name || 'Student Name'}
                </h3>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Level 4 Solver • {currentUser.points} XP
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                {gradeLevel || 'Program / Degree'}
              </p>
              {courses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {courses.slice(0, 3).map((c) => (
                    <span key={c} className="text-[10px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                      {c}
                    </span>
                  ))}
                  {courses.length > 3 && (
                    <span className="text-[10px] font-medium text-stone-400 px-1 py-0.5">
                      +{courses.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Section 1: Name & Program */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohan Mehta"
                  className="w-full text-xs sm:text-sm pl-3.5 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                <span>Degree / Academic Program</span>
                <span className="text-[10px] text-stone-400 font-normal">Shown under your name</span>
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. Undergraduate Student (B.Com / CA Aspirant), MBA, CPA Candidate"
                className="w-full text-xs sm:text-sm pl-3.5 pr-4 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
          </div>

          {/* Section 2: Profile Picture & Avatar Options */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                  Profile Picture & Avatar
                </label>
                <p className="text-xs text-stone-500">
                  Select from student avatars or upload your custom profile photo
                </p>
              </div>

              {/* Toggle presets vs upload */}
              <div className="flex items-center p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAvatarMode('preset')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    avatarMode === 'preset'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Avatars
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('custom')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    avatarMode === 'custom'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Custom Photo
                </button>
              </div>
            </div>

            {avatarMode === 'preset' ? (
              <div>
                <div className="text-[11px] font-medium text-stone-500 mb-2">
                  Choose your student avatar:
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {PRESET_AVATARS.map((item) => {
                    const isSelected = avatar === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAvatar(item.url)}
                        className={`group relative rounded-2xl p-1 transition-all flex flex-col items-center ${
                          isSelected
                            ? 'ring-3 ring-blue-600 bg-blue-50/50 scale-105 shadow-sm'
                            : 'hover:bg-stone-100 hover:scale-102 border border-stone-200/80'
                        }`}
                        title={item.label}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          className="w-12 h-12 rounded-full object-cover ring-1 ring-stone-200 aspect-square"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] text-stone-600 font-medium truncate w-full text-center mt-1">
                          {item.label.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
                {/* File Upload Option */}
                <div>
                  <div className="text-xs font-semibold text-stone-800 mb-2">
                    Upload from Device
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 border-2 border-dashed border-stone-300 hover:border-blue-500 rounded-xl bg-white hover:bg-blue-50/20 text-stone-600 hover:text-blue-600 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Browse Image File (PNG, JPG, WebP)</span>
                  </button>
                </div>

                {/* URL Option */}
                <div>
                  <div className="text-xs font-semibold text-stone-800 mb-1.5">
                    Or Paste Image URL
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      disabled={!customImageUrl.trim()}
                      className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Courses */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1 flex items-center justify-between">
                <span>Enrolled Courses & Subjects</span>
                <span className="text-[10px] text-stone-400 font-normal">
                  {courses.length} courses added
                </span>
              </label>
              <p className="text-xs text-stone-500 mb-2.5">
                Add the subjects and courses you are currently studying or tutoring
              </p>
            </div>

            {/* Current Courses Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-stone-50 border border-stone-200/80">
              {courses.length === 0 ? (
                <span className="text-xs text-stone-400 italic p-1">
                  No courses added yet. Type below or click a suggestion!
                </span>
              ) : (
                courses.map((course) => (
                  <span
                    key={course}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-stone-200 text-stone-800 px-2.5 py-1 rounded-lg shadow-2xs group"
                  >
                    <BookOpen className="w-3 h-3 text-blue-600" />
                    <span>{course}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(course)}
                      className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
                      title={`Remove ${course}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Custom Course Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCourseInput}
                onChange={(e) => setNewCourseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCourse();
                  }
                }}
                placeholder="Type course name (e.g., Corporate Accounting, Econometrics, GST)..."
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddCourse()}
                disabled={!newCourseInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="text-[11px] font-semibold text-stone-500 mb-1.5">
                Quick Add Suggestions:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_COURSES.map((sug) => {
                  const alreadyAdded = courses.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddCourse(sug)}
                      className={`text-[11px] font-medium px-2 py-1 rounded-lg transition-all ${
                        alreadyAdded
                          ? 'bg-stone-100 text-stone-400 cursor-default'
                          : 'bg-stone-100 hover:bg-blue-50 hover:text-blue-700 text-stone-700 border border-stone-200/60'
                      }`}
                    >
                      {alreadyAdded ? '✓ ' : '+ '}
                      {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Bio / Study Tagline */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
              Bio or Study Goal
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Aiming for CA Inter Group 1 • Sharing balance sheet & tax solutions"
              rows={2}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
