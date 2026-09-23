import { useState } from 'react';
import { Sparkles, FileText, Video, Star, ArrowRight, X, CheckCircle2, HelpCircle, Search, Upload } from 'lucide-react';

interface BeginnerGuideBannerProps {
  onExploreClick: () => void;
  onPostClick: () => void;
  onSearchClick?: () => void;
  onSolveClick?: () => void;
  onTopSolutionsClick?: () => void;
}

export default function BeginnerGuideBanner({ 
  onExploreClick, 
  onPostClick,
  onSearchClick,
  onSolveClick,
  onTopSolutionsClick,
}: BeginnerGuideBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('studysolve_guide_dismissed') === 'true';
  });

  const handleCard1Click = () => {
    onPostClick();
  };

  const handleCard2Click = () => {
    if (onSolveClick) {
      onSolveClick();
    } else if (onSearchClick) {
      onSearchClick();
    } else {
      onExploreClick();
    }
  };

  const handleCard3Click = () => {
    if (onTopSolutionsClick) {
      onTopSolutionsClick();
    } else {
      onExploreClick();
    }
  };

  if (dismissed) {
    return (
      <div className="flex justify-end mb-3">
        <button
          onClick={() => {
            setDismissed(false);
            localStorage.removeItem('studysolve_guide_dismissed');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-blue-600 dark:text-stone-300 dark:hover:text-blue-400 bg-white dark:bg-stone-900 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-800 transition-colors shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>How StudySolve Works (Beginner Guide)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-stone-950 border border-transparent dark:border-blue-900/40 rounded-2xl p-5 sm:p-6 text-white shadow-md mb-6">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 dark:bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 dark:bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem('studysolve_guide_dismissed', 'true');
        }}
        className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Dismiss guide"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 max-w-4xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Beginner-Friendly Group Learning
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
          Collaborative Problem Solving with Verified Multi-Format Solutions
        </h2>
        <p className="text-blue-100/90 dark:text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed mb-6">
          Whether you are solving a tricky partnership realization account, balancing a complex financial ledger, navigating GST computations, or reviewing macroeconomics models — StudySolve makes peer learning effortless.
        </p>

        {/* 3 Step Interactive Workflow - Clickable to Upload or Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Step 1: Click to Upload Question */}
          <button
            type="button"
            onClick={handleCard1Click}
            className="group text-left bg-white/10 dark:bg-stone-900/60 hover:bg-white/15 dark:hover:bg-stone-800/80 border border-white/15 dark:border-stone-700/60 hover:border-blue-400/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-400/30">
                  1
                </span>
                <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1 group-hover:text-blue-200 transition-colors">
                Share Tricky Problems
              </h3>
              <p className="text-xs text-blue-100/80 dark:text-stone-300 leading-normal mb-3">
                Post problem sets, homework sheets, or exam questions with PDF or image attachments.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 group-hover:text-blue-200">
              <span>Click to Upload a Question</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Step 2: Click to Search & Solve */}
          <button
            type="button"
            onClick={handleCard2Click}
            className="group text-left bg-white/10 dark:bg-stone-900/60 hover:bg-white/15 dark:hover:bg-stone-800/80 border border-white/15 dark:border-stone-700/60 hover:border-indigo-400/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-400/30">
                  2
                </span>
                <Search className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1 group-hover:text-indigo-200 transition-colors">
                Post Multi-Format Solutions
              </h3>
              <p className="text-xs text-blue-100/80 dark:text-stone-300 leading-normal mb-3">
                Upload typed <strong>PDFs</strong>, handwritten <strong>Images</strong>, or recorded <strong>Video walkthroughs</strong>.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 group-hover:text-indigo-200">
              <span>Click to Search & Solve Problems</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Step 3: Click to Search & Rate Solutions */}
          <button
            type="button"
            onClick={handleCard3Click}
            className="group text-left bg-white/10 dark:bg-stone-900/60 hover:bg-white/15 dark:hover:bg-stone-800/80 border border-white/15 dark:border-stone-700/60 hover:border-amber-400/50 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-400/30">
                  3
                </span>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1 group-hover:text-amber-200 transition-colors">
                Quality Peer Rating
              </h3>
              <p className="text-xs text-blue-100/80 dark:text-stone-300 leading-normal mb-3">
                Rate explanations on <strong>Clarity</strong>, <strong>Accuracy</strong>, and <strong>Step-by-Step</strong> depth to spotlight top answers.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 group-hover:text-amber-200">
              <span>Click to Browse & Rate Solutions</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Quick CTA Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExploreClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & Browse Questions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onPostClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 dark:bg-stone-800/80 hover:bg-white/25 dark:hover:bg-stone-700 text-white font-semibold text-xs sm:text-sm border border-white/20 dark:border-stone-600 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload a Question</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-300 dark:text-stone-400 ml-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Click any step 1, 2, or 3 above to start</span>
          </div>
        </div>
      </div>
    </div>
  );
}
