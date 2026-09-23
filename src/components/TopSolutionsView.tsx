import { useState } from 'react';
import { Sparkles, FileText, Image as ImageIcon, Video, Star, Filter } from 'lucide-react';
import { Solution } from '../types';
import SolutionCard from './SolutionCard';

interface TopSolutionsViewProps {
  solutions: Solution[];
  onOpenSolution: (solution: Solution) => void;
  onVoteHelpful: (solutionId: string) => void;
}

export default function TopSolutionsView({
  solutions,
  onOpenSolution,
  onVoteHelpful,
}: TopSolutionsViewProps) {
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'image' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'helpful' | 'newest'>('rating');

  const filtered = solutions
    .filter((sol) => {
      if (formatFilter === 'all') return true;
      return sol.solutionType === formatFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'helpful') return b.helpfulVotes - a.helpfulVotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-300 uppercase tracking-wide mb-1">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>High-Yield Explanations</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Top Rated Community Solutions
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1 leading-relaxed">
            Browse peer-verified solutions rated highest for explanation clarity, accounting accuracy, and step-by-step guidance.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/15 text-xs overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              formatFilter === 'all' ? 'bg-white text-stone-900 font-bold' : 'text-stone-300 hover:text-white'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setFormatFilter('pdf')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0 ${
              formatFilter === 'pdf' ? 'bg-rose-500 text-white font-bold' : 'text-stone-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" /> PDF
          </button>
          <button
            onClick={() => setFormatFilter('image')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0 ${
              formatFilter === 'image' ? 'bg-amber-500 text-white font-bold' : 'text-stone-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" /> Image
          </button>
          <button
            onClick={() => setFormatFilter('video')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 shrink-0 ${
              formatFilter === 'video' ? 'bg-purple-500 text-white font-bold' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 shrink-0" /> Video
          </button>
        </div>
      </div>

      {/* Sort row */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <div>
          Showing <strong>{filtered.length}</strong> solutions
        </div>
        <div className="flex items-center gap-2">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-stone-200 text-stone-800 font-medium rounded-lg px-2.5 py-1 outline-none"
          >
            <option value="rating">Highest Star Rating</option>
            <option value="helpful">Most Helpful Votes</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Solutions Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No solutions posted yet</h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Once problems are uploaded and solved with PDFs, image sheets, or video walkthroughs, top-rated solutions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sol) => (
            <SolutionCard
              key={sol.id}
              solution={sol}
              onOpenSolution={onOpenSolution}
              onVoteHelpful={onVoteHelpful}
            />
          ))}
        </div>
      )}
    </div>
  );
}
