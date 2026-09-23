import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Sparkles, 
  Check, 
  Calendar, 
  Tag, 
  Users 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyGroup, Subject, DifficultyLevel, StudyMaterial, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: StudyGroup[];
  selectedGroupId: string | null;
  onAddMaterial: (newMaterial: StudyMaterial) => void;
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

export default function CreateMaterialModal({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  onAddMaterial,
  currentUser,
}: CreateMaterialModalProps) {
  if (!isOpen) return null;

  const [groupId, setGroupId] = useState(selectedGroupId || (groups[0]?.id ?? 'general'));
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('Financial Accounting');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Balance Sheet', 'Exam Prep']);

  // Attachment states
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'image' | 'text'>('pdf');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentSize, setAttachmentSize] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setAttachmentName(file.name);
    setAttachmentSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentUrl(e.target?.result as string);
        setAttachmentType('image');
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentUrl(e.target?.result as string);
        setAttachmentType('pdf');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const group = groups.find((g) => g.id === groupId);
    const finalSubject: Subject = isCustomSubject
      ? (customSubjectText.trim() || 'General Subject')
      : subject;

    const newMaterial: StudyMaterial = {
      id: `mat-${Date.now()}`,
      groupId,
      groupName: group?.name || 'Open Study Group',
      title: title.trim(),
      subject: finalSubject,
      topic: topic.trim() || 'General Study',
      difficulty,
      description: description.trim() || title.trim(),
      problemStatement: problemStatement.trim() || description.trim() || title.trim(),
      author: {
        name: currentUser.name || 'Anonymous Student',
        avatar: getStudentAvatar(currentUser.name, currentUser.avatar),
        role: 'Student Member',
        uid: currentUser.authUid || currentUser.id,
      },
      authorUid: currentUser.authUid || currentUser.id,
      attachment: attachmentName
        ? {
            type: attachmentType,
            name: attachmentName,
            size: attachmentSize || '1.2 MB',
            url: attachmentUrl || undefined,
            contentPreview: `Attached study sheet: ${attachmentName}`,
          }
        : {
            type: 'text',
            name: 'Problem_Prompt.txt',
            contentPreview: problemStatement.slice(0, 80),
          },
      createdAt: 'Just now',
      dueDate,
      tags,
      solutionsCount: 0,
      averageRating: 0,
      isSolved: false,
    };

    onAddMaterial(newMaterial);

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
              StudySolve Material Hub
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Share New Study Material or Problem Set
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Group */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Target Study Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-medium outline-none focus:border-blue-500"
              required
            >
              {groups.length === 0 ? (
                <option value="general">📚 General / Open Study Circle</option>
              ) : (
                groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.badgeEmoji} {g.name} ({g.subject})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Title & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Material Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Partnership Realisation Account or GST ITC Reconciliation"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Topic / Unit
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Dissolution of Partnership Firm / Tax Head Salaries"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-stone-200 outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Subject & Difficulty & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
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
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-medium"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                Target Date / Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-medium"
              />
            </div>
          </div>

          {/* Problem Statement & Instructions */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Problem Statement & Specific Questions to Solve
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Paste the accounting problem, trial balance figures, tax scenario, or economics prompt here... Other students will solve this and post step-by-step PDF, Image, or Video solutions!"
              rows={4}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* Attachment: PDF or Image file */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Attach Homework Sheet / Problem File (PDF or Image)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : attachmentName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-blue-600" />
                {attachmentName ? (
                  <div>
                    <div className="font-bold text-xs text-emerald-800 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{attachmentName}</span>
                    </div>
                    <div className="text-[10px] text-stone-500">{attachmentSize} • Click to change</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-stone-800">
                      Upload PDF or diagram image of problem
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">Drag & drop or browse</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
              Tags
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Calculus, Vectors, Midterm)..."
                className="flex-1 text-xs p-2 rounded-xl border border-stone-200"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Student Identity & Mistake Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>Posting as <strong>{currentUser.name}</strong> (Student ID: <code className="font-mono bg-blue-100/70 px-1 py-0.5 rounded text-[11px]">{currentUser.authUid ? currentUser.authUid.slice(0, 10) + '...' : currentUser.id}</code>).</span>
              <span className="block text-blue-700 text-[11px] mt-0.5">
                Sent mistakenly? You can delete this question at any time with one click.
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Share Study Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
