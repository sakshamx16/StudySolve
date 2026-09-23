import { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Star, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import { StudyMaterial, Solution, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface MaterialCardProps {
  material: StudyMaterial;
  solutions: Solution[];
  currentUser?: UserProfile;
  onOpenDetail: (material: StudyMaterial) => void;
  onPostSolution: (material: StudyMaterial) => void;
  onSelectGroup?: (groupId: string) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

export default function MaterialCard({
  material,
  solutions,
  currentUser,
  onOpenDetail,
  onPostSolution,
  onSelectGroup,
  onDeleteMaterial,
}: MaterialCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const materialSolutions = solutions.filter((s) => s.materialId === material.id);
  const hasSolutions = materialSolutions.length > 0;
  
  // Calculate top rating or average
  const topSolution = materialSolutions.reduce<Solution | null>((top, current) => {
    if (!top || current.averageRating > top.averageRating) return current;
    return top;
  }, null);

  // Check formats available
  const hasPdf = materialSolutions.some((s) => s.solutionType === 'pdf');
  const hasImage = materialSolutions.some((s) => s.solutionType === 'image');
  const hasVideo = materialSolutions.some((s) => s.solutionType === 'video');

  // Difficulty badge styling
  const difficultyColors = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden">
      <div className="p-5 sm:p-6">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectGroup?.(material.groupId)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
            >
              <Users className="w-3 h-3 text-stone-500" />
              <span className="truncate max-w-[140px]">{material.groupName}</span>
            </button>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                difficultyColors[material.difficulty]
              }`}
            >
              {material.difficulty}
            </span>
          </div>

          <span className="text-[11px] font-medium text-stone-400">
            {material.subject} • {material.topic}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onOpenDetail(material)}
          className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-blue-600 transition-colors cursor-pointer mb-2 line-clamp-2"
        >
          {material.title}
        </h3>

        {/* Problem Excerpt */}
        <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 mb-4 leading-relaxed">
          {material.description || material.problemStatement}
        </p>

        {/* Attachment Pill (if any) */}
        {material.attachment && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs text-stone-700 max-w-full">
            {material.attachment.type === 'pdf' && <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
            {material.attachment.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            {material.attachment.type === 'text' && <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            <span className="truncate font-medium text-[11px]">{material.attachment.name}</span>
            {material.attachment.size && (
              <span className="text-[10px] text-stone-400 shrink-0">({material.attachment.size})</span>
            )}
          </div>
        )}

        {/* Solutions format preview chips */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5">
            {hasSolutions ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-stone-700">Formats:</span>
                {hasPdf && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                    <FileText className="w-2.5 h-2.5" /> PDF
                  </span>
                )}
                {hasImage && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                    <ImageIcon className="w-2.5 h-2.5" /> Image
                  </span>
                )}
                {hasVideo && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                    <Video className="w-2.5 h-2.5" /> Video
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <Sparkles className="w-3 h-3 text-amber-500" /> Needs Solution
              </span>
            )}
          </div>

          {/* Rating Badge */}
          {hasSolutions && topSolution ? (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-900">
                {topSolution.averageRating.toFixed(1)}
              </span>
              <span className="text-[10px] text-stone-500">
                ({materialSolutions.length} {materialSolutions.length === 1 ? 'solution' : 'solutions'})
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-stone-400">Be the first to solve</span>
          )}
        </div>
      </div>

      {/* Footer Details & Action Buttons */}
      <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-3">
        {/* Author Avatar & Date */}
        <div className="flex items-center gap-2 truncate">
          <img
            src={getStudentAvatar(material.author.name, material.author.avatar)}
            alt={material.author.name}
            className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-200 shrink-0 aspect-square"
            referrerPolicy="no-referrer"
          />
          <div className="truncate text-[11px]">
            <span className="font-semibold text-stone-800">{material.author.name || 'Student'}</span>
            <span className="text-stone-400 ml-1.5">{material.createdAt}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onDeleteMaterial && (
            confirmDelete ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 text-[11px] animate-in fade-in">
                <span className="text-rose-800 font-semibold">Delete Question?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMaterial(material.id);
                  }}
                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[10px]"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                title="Delete Question?"
                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}

          <button
            onClick={() => onPostSolution(material)}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            Solve
          </button>
          <button
            onClick={() => onOpenDetail(material)}
            className="px-3 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors flex items-center gap-1"
          >
            <span>View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
