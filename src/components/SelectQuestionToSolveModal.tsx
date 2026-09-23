import { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  PenTool, 
  FileText, 
  Clock, 
  Users,
  Filter
} from 'lucide-react';
import { StudyMaterial, Solution } from '../types';

interface SelectQuestionToSolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: StudyMaterial[];
  solutions: Solution[];
  onSelectMaterialToSolve: (material: StudyMaterial) => void;
}

export default function SelectQuestionToSolveModal({
  isOpen,
  onClose,
  materials,
  solutions,
  onSelectMaterialToSolve,
}: SelectQuestionToSolveModalProps) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'needs-solution'>('needs-solution');

  // Filter materials
  const filtered = materials.filter((m) => {
    const hasSolutions = solutions.some((s) => s.materialId === m.id);
    if (filterType === 'needs-solution' && hasSolutions) {
      return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSubject = m.subject.toLowerCase().includes(q);
      const matchTopic = m.topic.toLowerCase().includes(q);
      const matchGroup = m.groupName.toLowerCase().includes(q);
      return matchTitle || matchSubject || matchTopic || matchGroup;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 shrink-0 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wide mb-1">
              <span className="w-5 h-5 rounded-full bg-indigo-500/40 text-indigo-200 flex items-center justify-center text-[11px] font-bold">2</span>
              Step 2: Solve & Post Solution
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Choose a Question to Solve
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-lg">
              Select which problem or study question you want to provide a PDF, handwritten image, or video explanation for.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-stone-200/80 bg-stone-50/70 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, question title, or subject..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <button
                type="button"
                onClick={() => setFilterType('needs-solution')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterType === 'needs-solution'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                Needs Solution First
              </button>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                All Questions ({materials.length})
              </button>
            </div>
            <span className="text-stone-500 font-medium text-[11px]">
              {filtered.length} matching
            </span>
          </div>
        </div>

        {/* Material Selection List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 min-h-[240px]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <HelpCircle className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <div className="font-semibold text-stone-800 text-sm">No questions found</div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                {filterType === 'needs-solution' 
                  ? 'All currently listed questions already have solutions! Try switching to "All Questions" to add an alternate explanation.' 
                  : 'Try adjusting your search keywords.'}
              </p>
            </div>
          ) : (
            filtered.map((mat) => {
              const solCount = solutions.filter((s) => s.materialId === mat.id).length;
              return (
                <div
                  key={mat.id}
                  onClick={() => {
                    onSelectMaterialToSolve(mat);
                    onClose();
                  }}
                  className="group p-3.5 rounded-2xl border border-stone-200/90 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-700">
                        {mat.subject}
                      </span>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        {mat.groupName}
                      </span>
                      {solCount === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Needs Solution
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {solCount} {solCount === 1 ? 'solution' : 'solutions'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-stone-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {mat.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {mat.problemStatement || mat.topic}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Solve</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <span>Choose any question to open the PDF, image, or video solution creator.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
