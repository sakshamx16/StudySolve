import { useState } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Download, 
  Calendar, 
  Users, 
  Tag, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Trash2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { StudyMaterial, Solution, DifficultyLevel, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';
import SolutionCard from './SolutionCard';

interface MaterialDetailModalProps {
  material: StudyMaterial | null;
  solutions: Solution[];
  currentUser?: UserProfile;
  onClose: () => void;
  onPostSolution: (material: StudyMaterial) => void;
  onOpenSolution: (solution: Solution) => void;
  onVoteHelpful: (solutionId: string) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

export default function MaterialDetailModal({
  material,
  solutions,
  currentUser,
  onClose,
  onPostSolution,
  onOpenSolution,
  onVoteHelpful,
  onDeleteMaterial,
}: MaterialDetailModalProps) {
  if (!material) return null;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [solutionTypeFilter, setSolutionTypeFilter] = useState<'all' | 'pdf' | 'image' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'newest' | 'helpful'>('rating');

  // Filter solutions for this material
  const materialSolutions = solutions.filter((s) => s.materialId === material.id);

  const filteredSolutions = materialSolutions
    .filter((s) => {
      if (solutionTypeFilter === 'all') return true;
      return s.solutionType === solutionTypeFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'helpful') return b.helpfulVotes - a.helpfulVotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const difficultyColors = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              {material.subject}
            </span>
            <span className="text-stone-400 text-xs">•</span>
            <span className="text-stone-300 text-xs font-medium truncate max-w-xs">
              {material.groupName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteMaterial && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-rose-100 border border-rose-400/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Delete Question?"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Question?</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Question Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">
                    Delete Question?
                  </h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    Confirming will permanently remove this question from the group and database.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteMaterial?.(material.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Yes, Delete Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Title & Metadata row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                  difficultyColors[material.difficulty]
                }`}
              >
                {material.difficulty} Level
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Topic: {material.topic}
              </span>
              {material.dueDate && (
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 flex items-center gap-1 font-medium ml-auto">
                  <Calendar className="w-3 h-3" /> Target Date: {material.dueDate}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              {material.title}
            </h2>

            {/* Author */}
            <div className="flex items-center gap-2 mt-3 text-xs text-stone-500">
              <img
                src={getStudentAvatar(material.author.name, material.author.avatar)}
                alt={material.author.name}
                className="w-6 h-6 rounded-full object-cover aspect-square"
                referrerPolicy="no-referrer"
              />
              <span>
                Shared by <strong className="text-stone-800">{material.author.name || 'Student'}</strong> ({material.author.role || 'Member'}) on {material.createdAt}
              </span>
            </div>
          </div>

          {/* Problem Statement Card */}
          <div className="bg-stone-50 rounded-2xl p-5 sm:p-6 border border-stone-200">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Problem Statement & Assignment Description
            </h3>
            <div className="text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-serif">
              {material.problemStatement}
            </div>

            {/* Attached Study File (PDF or Image) */}
            {material.attachment && (
              <div className="mt-5 pt-4 border-t border-stone-200/80">
                <div className="text-xs font-semibold text-stone-600 mb-2">
                  Attached Reference Material:
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      {material.attachment.type === 'pdf' ? (
                        <FileText className="w-5 h-5 text-rose-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {material.attachment.name}
                      </div>
                      {material.attachment.size && (
                        <div className="text-[11px] text-stone-400">
                          {material.attachment.size} • Reference Document
                        </div>
                      )}
                    </div>
                  </div>

                  {material.attachment.url && (
                    <a
                      href={material.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                </div>

                {/* If Image attachment, show image preview */}
                {material.attachment.type === 'image' && material.attachment.url && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-stone-200 max-h-64 bg-stone-900 flex justify-center">
                    <img
                      src={material.attachment.url}
                      alt={material.attachment.name}
                      className="object-contain max-h-64"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {material.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Call to Action: Post a Solution */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-200" /> Have you solved this problem?
              </h3>
              <p className="text-xs text-blue-100 mt-1 max-w-md">
                Share your working as a <strong>PDF</strong>, handwritten <strong>Image</strong>, or <strong>Video walkthrough</strong> to help your study group!
              </p>
            </div>

            <button
              onClick={() => onPostSolution(material)}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post Your Solution</span>
            </button>
          </div>

          {/* Solutions Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Multiple Peer Solutions ({materialSolutions.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Anyone in this group can answer this question with their own approach under their unique student ID.
                </p>
              </div>

              {/* Filter tabs & Sort */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setSolutionTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      solutionTypeFilter === 'all'
                        ? 'bg-white text-stone-900 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({materialSolutions.length})
                  </button>
                  <button
                    onClick={() => setSolutionTypeFilter('pdf')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      solutionTypeFilter === 'pdf'
                        ? 'bg-white text-rose-700 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    PDFs
                  </button>
                  <button
                    onClick={() => setSolutionTypeFilter('image')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      solutionTypeFilter === 'image'
                        ? 'bg-white text-amber-700 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Images
                  </button>
                  <button
                    onClick={() => setSolutionTypeFilter('video')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      solutionTypeFilter === 'video'
                        ? 'bg-white text-purple-700 font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Videos
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-stone-100 hover:bg-stone-200 border-none rounded-xl px-3 py-1.5 font-medium text-stone-700 outline-none"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* List of Solutions */}
            <div className="mt-4 space-y-4">
              {filteredSolutions.length === 0 ? (
                <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200/80">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-stone-800 text-sm">No solutions posted yet</h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                    Be the first student to upload a step-by-step PDF, diagram, or video solution and earn reputation points!
                  </p>
                  <button
                    onClick={() => onPostSolution(material)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload First Solution</span>
                  </button>
                </div>
              ) : (
                filteredSolutions.map((sol) => (
                  <SolutionCard
                    key={sol.id}
                    solution={sol}
                    onOpenSolution={onOpenSolution}
                    onVoteHelpful={onVoteHelpful}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          {onDeleteMaterial ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Question?</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPostSolution(material)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Submit My Solution</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
