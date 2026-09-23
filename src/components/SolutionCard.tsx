import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  Clock, 
  ExternalLink,
  ChevronRight,
  BadgeCheck,
  Layers
} from 'lucide-react';
import { Solution } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface SolutionCardProps {
  solution: Solution;
  onOpenSolution: (solution: Solution) => void;
  onVoteHelpful?: (solutionId: string) => void;
}

export default function SolutionCard({
  solution,
  onOpenSolution,
  onVoteHelpful,
}: SolutionCardProps) {
  const formatBadges = {
    pdf: {
      label: 'PDF Solution',
      icon: FileText,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-600',
    },
    image: {
      label: 'Image / Notes',
      icon: ImageIcon,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
    },
    video: {
      label: 'Video Walkthrough',
      icon: Video,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-600',
    },
  };

  const badge = formatBadges[solution.solutionType];
  const FormatIcon = badge.icon;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Top bar: Format Badge, Rating, Verification */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.color}`}
            >
              <FormatIcon className={`w-3.5 h-3.5 ${badge.iconColor}`} />
              <span>{badge.label}</span>
            </span>
            {solution.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-950">
              {solution.averageRating.toFixed(1)}
            </span>
            <span className="text-[10px] text-stone-500">
              ({solution.ratingsCount} {solution.ratingsCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {/* Title */}
        <h4
          onClick={() => onOpenSolution(solution)}
          className="text-base font-bold text-stone-900 group-hover:text-blue-600 transition-colors cursor-pointer mb-2 line-clamp-2"
        >
          {solution.title}
        </h4>

        {/* Associated Material Title (if available) */}
        {solution.materialTitle && (
          <p className="text-xs text-stone-500 mb-3 flex items-center gap-1">
            <span className="text-stone-400">Problem:</span>
            <span className="font-medium text-stone-700 truncate">{solution.materialTitle}</span>
          </p>
        )}

        {/* Granular Criteria Breakdown Mini Bars */}
        <div className="bg-stone-50 rounded-xl p-3 mb-3 border border-stone-100 space-y-1.5">
          <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider flex justify-between">
            <span>Quality Criteria</span>
            <span>Score (out of 5)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/60">
              <div className="text-[10px] text-stone-500 font-medium">Clarity</div>
              <div className="font-bold text-stone-800 text-xs">
                {solution.criteriaBreakdown.clarity.toFixed(1)} ★
              </div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/60">
              <div className="text-[10px] text-stone-500 font-medium">Accuracy</div>
              <div className="font-bold text-stone-800 text-xs">
                {solution.criteriaBreakdown.accuracy.toFixed(1)} ★
              </div>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-stone-200/60">
              <div className="text-[10px] text-stone-500 font-medium">Step-by-Step</div>
              <div className="font-bold text-stone-800 text-xs">
                {solution.criteriaBreakdown.stepByStep.toFixed(1)} ★
              </div>
            </div>
          </div>
        </div>

        {/* Key takeaway */}
        {solution.keyTakeaway && (
          <p className="text-xs text-stone-600 italic bg-blue-50/50 border-l-2 border-blue-400 pl-2.5 py-1 mb-3 rounded-r">
            "{solution.keyTakeaway}"
          </p>
        )}

        {/* Tools used pills */}
        {solution.toolsUsed && solution.toolsUsed.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {solution.toolsUsed.map((tool) => (
              <span
                key={tool}
                className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info: Author & Open Action */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img
            src={getStudentAvatar(solution.author.name, solution.author.avatar)}
            alt={solution.author.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-200 aspect-square"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <span>{solution.author.name || 'Student Solver'}</span>
              {solution.author.badge && (
                <span className="text-[10px] text-blue-600 font-normal">
                  • {solution.author.badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-400">{solution.createdAt}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onVoteHelpful && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVoteHelpful(solution.id);
              }}
              className={`p-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                solution.hasVotedHelpful
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-stone-600 hover:bg-stone-100 border-stone-200'
              }`}
              title="Mark as helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">{solution.helpfulVotes}</span>
            </button>
          )}

          <button
            onClick={() => onOpenSolution(solution)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
          >
            <span>View Solution</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
