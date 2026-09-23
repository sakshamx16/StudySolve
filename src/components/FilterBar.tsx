import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Layers, 
  CheckCircle, 
  Clock, 
  Star,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Subject, DifficultyLevel } from '../types';

interface FilterBarProps {
  selectedSubject: Subject | 'All';
  onSelectSubject: (sub: Subject | 'All') => void;
  availableSubjects?: (Subject | string)[];
  selectedFormat: 'all' | 'pdf' | 'image' | 'video';
  onSelectFormat: (fmt: 'all' | 'pdf' | 'image' | 'video') => void;
  selectedDifficulty: DifficultyLevel | 'All';
  onSelectDifficulty: (diff: DifficultyLevel | 'All') => void;
  selectedStatus: 'all' | 'solved' | 'unsolved';
  onSelectStatus: (status: 'all' | 'solved' | 'unsolved') => void;
  sortBy: 'rating' | 'newest' | 'solutions' | 'dueDate';
  onSortByChange: (sort: 'rating' | 'newest' | 'solutions' | 'dueDate') => void;
  totalCount: number;
}

const DEFAULT_SUBJECTS: (Subject | 'All')[] = [
  'All',
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

export default function FilterBar({
  selectedSubject,
  onSelectSubject,
  availableSubjects = [],
  selectedFormat,
  onSelectFormat,
  selectedDifficulty,
  onSelectDifficulty,
  selectedStatus,
  onSelectStatus,
  sortBy,
  onSortByChange,
  totalCount,
}: FilterBarProps) {
  // Combine default subjects with any custom subjects
  const allSubjects = Array.from(
    new Set([
      ...DEFAULT_SUBJECTS,
      ...availableSubjects.filter((s) => s && s.trim().length > 0),
    ])
  );

  const isFiltered =
    selectedSubject !== 'All' ||
    selectedFormat !== 'all' ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    onSelectSubject('All');
    onSelectFormat('all');
    onSelectDifficulty('All');
    onSelectStatus('all');
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Subject Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {allSubjects.map((sub) => {
          const isActive = selectedSubject === sub;
          return (
            <button
              key={sub}
              onClick={() => onSelectSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-stone-900 text-white dark:bg-blue-600 dark:text-white shadow-xs font-semibold'
                  : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 dark:bg-stone-900 dark:text-stone-300 dark:border-stone-800 dark:hover:bg-stone-800 dark:hover:text-white'
              }`}
            >
              {sub === 'All' && <span>📚</span>}
              {sub === 'Financial Accounting' && <span>📊</span>}
              {sub === 'Cost & Management Accounting' && <span>📑</span>}
              {sub === 'Economics' && <span>📈</span>}
              {sub === 'Taxation & GST' && <span>⚖️</span>}
              {sub === 'Corporate & Business Law' && <span>🏛️</span>}
              {sub === 'Financial Management & Investment' && <span>💰</span>}
              {sub === 'Business Studies & Management' && <span>💼</span>}
              {sub === 'Business Mathematics & Statistics' && <span>🧮</span>}
              {sub === 'Auditing & Assurance' && <span>🔍</span>}
              {!DEFAULT_SUBJECTS.includes(sub) && <span>🏷️</span>}
              <span>{sub === 'All' ? 'All Subjects' : sub}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-filters row: Solution format, difficulty, status, and sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs transition-colors">
        {/* Solution Type Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500 mr-1 hidden sm:inline shrink-0">
            Solution format:
          </span>
          <button
            onClick={() => onSelectFormat('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              selectedFormat === 'all'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => onSelectFormat('pdf')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
              selectedFormat === 'pdf'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>PDF Solution</span>
          </button>
          <button
            onClick={() => onSelectFormat('image')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
              selectedFormat === 'image'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Image / Notes</span>
          </button>
          <button
            onClick={() => onSelectFormat('video')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
              selectedFormat === 'video'
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Video className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Video Walkthrough</span>
          </button>
        </div>

        {/* Secondary controls: Difficulty, Status & Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => onSelectDifficulty(e.target.value as DifficultyLevel | 'All')}
            className="text-xs bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 font-medium py-1.5 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 outline-none shrink-0 cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value as 'all' | 'solved' | 'unsolved')}
            className="text-xs bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 font-medium py-1.5 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 outline-none shrink-0 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Needs Solution</option>
          </select>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium hidden xs:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as any)}
              className="text-xs bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-stone-800 dark:text-stone-200 font-medium py-1.5 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 outline-none shrink-0 cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="newest">Newest First</option>
              <option value="solutions">Most Solutions</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>

          {/* Reset button if filtered */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results counter */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
        <span>
          Showing <strong>{totalCount}</strong> study problem{totalCount === 1 ? '' : 's'}
          {selectedSubject !== 'All' ? ` in ${selectedSubject}` : ''}
        </span>
      </div>
    </div>
  );
}
