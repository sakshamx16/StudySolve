import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Star, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ThumbsUp, 
  CheckCircle2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Clock, 
  Tag, 
  MessageSquare, 
  Sparkles, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Solution, SolutionReview, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface SolutionViewerModalProps {
  solution: Solution | null;
  onClose: () => void;
  onAddReview: (
    solutionId: string,
    rating: number,
    criteria: { clarity: number; accuracy: number; stepByStep: number },
    feedbackText: string,
    helpfulTags: string[]
  ) => void;
  onVoteHelpful: (solutionId: string) => void;
  currentUser: UserProfile;
}

const FEEDBACK_TAGS = [
  'Crystal Clear',
  'Easy to Follow',
  'Great Diagrams',
  'Handwriting Legible',
  'Step-by-Step Proof',
  'Alternate Shortcut',
  'Fixes Common Mistake',
  'High-Yield for Exams',
  'Clear Audio',
  'Neat LaTeX',
];

export default function SolutionViewerModal({
  solution,
  onClose,
  onAddReview,
  onVoteHelpful,
  currentUser,
}: SolutionViewerModalProps) {
  if (!solution) return null;

  // Active view tab inside modal
  const [activeTab, setActiveTab] = useState<'media' | 'steps' | 'reviews'>('media');

  // PDF Viewer states
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Interactive Rating Form state
  const [overallRating, setOverallRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [accuracyRating, setAccuracyRating] = useState(5);
  const [stepRating, setStepRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Crystal Clear', 'Easy to Follow']);
  const [reviewComment, setReviewComment] = useState('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Format Badge
  const isPdf = solution.solutionType === 'pdf';
  const isImage = solution.solutionType === 'image';
  const isVideo = solution.solutionType === 'video';

  // Toggle feedback tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Video timestamp seeker
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    onAddReview(
      solution.id,
      overallRating,
      {
        clarity: clarityRating,
        accuracy: accuracyRating,
        stepByStep: stepRating,
      },
      reviewComment.trim(),
      selectedTags
    );

    setHasSubmittedReview(true);

    // Celebrate with confetti
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 truncate">
            <span
              className={`p-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isPdf
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : isImage
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {isPdf && <FileText className="w-4 h-4" />}
              {isImage && <ImageIcon className="w-4 h-4" />}
              {isVideo && <Video className="w-4 h-4" />}
              <span>{solution.solutionType} Solution</span>
            </span>

            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {solution.title}
              </h2>
              <p className="text-xs text-stone-400 truncate">
                Problem: {solution.materialTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVoteHelpful(solution.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                solution.hasVotedHelpful
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-stone-800 text-stone-300 hover:text-white border-stone-700 hover:bg-stone-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Helpful ({solution.helpfulVotes})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              aria-label="Close solution modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Solver info & Subnavigation bar */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Author info */}
          <div className="flex items-center gap-2.5">
            <img
              src={getStudentAvatar(solution.author.name, solution.author.avatar)}
              alt={solution.author.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-xs aspect-square"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>{solution.author.name || 'Student Solver'}</span>
                {solution.author.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                    {solution.author.badge}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-500">
                {solution.author.gradeLevel || 'Student Solver'} • Submitted {solution.createdAt}
              </div>
            </div>
          </div>

          {/* Rating Summary Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-xl border border-stone-200 shadow-2xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold text-stone-900 text-sm">
                {solution.averageRating.toFixed(1)}
              </span>
              <span className="text-stone-400 text-xs">
                ({solution.ratingsCount} peer reviews)
              </span>
            </div>

            {/* Quality Criteria Mini Pills */}
            <div className="hidden lg:flex items-center gap-2 text-[11px] text-stone-600 bg-white px-3 py-1 rounded-xl border border-stone-200">
              <span>Clarity: <strong className="text-stone-900">{solution.criteriaBreakdown.clarity.toFixed(1)}</strong></span>
              <span>•</span>
              <span>Accuracy: <strong className="text-stone-900">{solution.criteriaBreakdown.accuracy.toFixed(1)}</strong></span>
              <span>•</span>
              <span>Steps: <strong className="text-stone-900">{solution.criteriaBreakdown.stepByStep.toFixed(1)}</strong></span>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl">
            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'media'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isPdf && 'PDF Document'}
              {isImage && 'Image Notes'}
              {isVideo && 'Video Walkthrough'}
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'steps'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Step-by-Step Breakdown ({solution.steps.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Reviews & Rating ({solution.reviews.length})
            </button>
          </div>
        </div>

        {/* Modal Main Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-stone-100/50">
          {/* TAB 1: MEDIA VIEWER */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* PDF VIEWER SIMULATOR */}
              {isPdf && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  {/* PDF Toolbar */}
                  <div className="p-3 bg-stone-800 text-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span className="font-semibold text-white truncate max-w-xs">
                        {solution.fileName || 'Solution_Document.pdf'}
                      </span>
                      {solution.fileSize && (
                        <span className="text-stone-400">({solution.fileSize})</span>
                      )}
                    </div>

                    {/* Page pagination */}
                    {solution.pdfPages && solution.pdfPages.length > 1 && (
                      <div className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded-lg">
                        <button
                          onClick={() => setCurrentPdfPage((p) => Math.max(0, p - 1))}
                          disabled={currentPdfPage === 0}
                          className="p-1 hover:text-white disabled:opacity-30"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-1 font-medium">
                          Page {currentPdfPage + 1} of {solution.pdfPages.length}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPdfPage((p) =>
                              Math.min((solution.pdfPages?.length || 1) - 1, p + 1)
                            )
                          }
                          disabled={currentPdfPage === (solution.pdfPages.length - 1)}
                          className="p-1 hover:text-white disabled:opacity-30"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Zoom & Download */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                        className="p-1 hover:text-white text-stone-400"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono text-stone-300">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                        className="p-1 hover:text-white text-stone-400"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={solution.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>

                  {/* PDF Document Canvas View */}
                  <div className="p-6 sm:p-10 bg-stone-200/60 flex justify-center min-h-[420px] overflow-x-auto">
                    <div
                      className="bg-white rounded-lg shadow-md border border-stone-300 p-8 sm:p-12 w-full max-w-2xl transition-transform origin-top"
                      style={{ transform: `scale(${zoomLevel / 100})` }}
                    >
                      <div className="border-b border-stone-200 pb-4 mb-6 flex justify-between items-start">
                        <div>
                          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            StudySolve Peer Academic Solution Sheet
                          </div>
                          <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">
                            {solution.title}
                          </h3>
                          <div className="text-xs text-stone-600 mt-1">
                            Author: <span className="font-semibold">{solution.author.name}</span> • Format: Typed LaTeX Document
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            Verified Solution
                          </span>
                        </div>
                      </div>

                      {/* Render Page Content */}
                      <div className="space-y-6 text-stone-800 text-sm leading-relaxed">
                        {solution.pdfPages ? (
                          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 font-sans">
                            <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                              Page {currentPdfPage + 1} Section Details:
                            </div>
                            <p className="text-stone-900 font-medium whitespace-pre-line text-sm sm:text-base">
                              {solution.pdfPages[currentPdfPage]}
                            </p>
                          </div>
                        ) : null}

                        {/* Render Steps inside the document view */}
                        <div className="space-y-4 pt-2">
                          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                            Mathematical Derivation & Proof:
                          </div>
                          {solution.steps.map((st) => (
                            <div key={st.stepNumber} className="border-l-2 border-stone-900 pl-4 py-1">
                              <h4 className="font-bold text-sm text-stone-900">
                                Step {st.stepNumber}: {st.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-stone-700 mt-1">
                                {st.explanation}
                              </p>
                              {st.formulaOrSnippet && (
                                <div className="mt-2 p-2.5 bg-stone-900 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto shadow-inner">
                                  {st.formulaOrSnippet}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Key takeaway note */}
                        {solution.keyTakeaway && (
                          <div className="mt-6 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-lg text-xs">
                            <strong>Key Concept / Final Answer:</strong> {solution.keyTakeaway}
                          </div>
                        )}
                      </div>

                      <div className="mt-10 pt-4 border-t border-stone-200 flex justify-between text-[10px] text-stone-400">
                        <span>StudySolve Verification Engine</span>
                        <span>Page {currentPdfPage + 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGE / HANDWRITTEN NOTES VIEWER */}
              {isImage && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-3 bg-stone-800 text-stone-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-white">Handwritten Notes & Diagrams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={solution.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Save Full Image</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-4 sm:p-8 bg-stone-900/90 flex flex-col items-center justify-center">
                    <div className="relative max-w-2xl w-full bg-stone-950 rounded-xl overflow-hidden shadow-2xl border border-stone-800">
                      <img
                        src={solution.mediaUrl}
                        alt={solution.title}
                        className="w-full h-auto object-contain max-h-[500px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {solution.imageCaption && (
                      <p className="text-xs text-stone-300 mt-3 text-center max-w-xl italic">
                        {solution.imageCaption}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* VIDEO WALKTHROUGH PLAYER */}
              {isVideo && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="p-3 bg-stone-900 text-stone-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">Video Solution Walkthrough</span>
                      {solution.videoDuration && (
                        <span className="text-stone-400">({solution.videoDuration})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Speed:</span>
                      {[0.75, 1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            if (videoRef.current) videoRef.current.playbackRate = speed;
                          }}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                            playbackSpeed === speed
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Player */}
                  <div className="relative bg-black flex justify-center items-center">
                    <video
                      ref={videoRef}
                      src={solution.mediaUrl}
                      className="w-full max-h-[440px] object-contain"
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration);
                        }
                      }}
                      controls
                      playsInline
                    />
                  </div>

                  {/* Interactive Timestamp Navigation */}
                  {solution.videoTimestamps && solution.videoTimestamps.length > 0 && (
                    <div className="p-4 bg-stone-50 border-t border-stone-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 mb-2">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Jump to Video Chapter / Topic:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {solution.videoTimestamps.map((ts) => (
                          <button
                            key={ts.timeInSeconds}
                            onClick={() => seekTo(ts.timeInSeconds)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-purple-300 hover:bg-purple-50 text-xs text-stone-800 font-medium transition-colors group shadow-2xs"
                          >
                            <span className="font-mono text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
                              {ts.timeDisplay}
                            </span>
                            <span className="group-hover:text-purple-900">{ts.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP BREAKDOWN */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <span>Step-by-Step Derivation & Methodology</span>
                  </h3>
                  <span className="text-xs text-stone-500">
                    {solution.steps.length} sequential steps
                  </span>
                </div>

                <div className="space-y-4">
                  {solution.steps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-bold text-xs flex items-center justify-center">
                          {st.stepNumber}
                        </span>
                        <h4 className="font-bold text-sm text-stone-900">{st.title}</h4>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-8">
                        {st.explanation}
                      </p>
                      {st.formulaOrSnippet && (
                        <div className="mt-3 ml-8 p-3 rounded-lg bg-stone-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                          {st.formulaOrSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Key Takeaway */}
                {solution.keyTakeaway && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Key Takeaway & Intuition
                    </div>
                    <p className="text-sm font-medium text-stone-800">
                      "{solution.keyTakeaway}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS & RATING ENGINE */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Quality Scorecard Box */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="text-center p-3 bg-amber-50 rounded-2xl border border-amber-200/80 min-w-[90px]">
                      <div className="text-3xl font-black text-amber-900">
                        {solution.averageRating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center text-amber-500 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= Math.round(solution.averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        {solution.ratingsCount} peer ratings
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-900 text-base">Peer Solution Quality Score</h4>
                      <p className="text-xs text-stone-500 max-w-sm mt-0.5">
                        Students evaluate clarity, mathematical correctness, and complete intermediate steps.
                      </p>
                    </div>
                  </div>

                  {/* Quality Breakdown Bars */}
                  <div className="w-full sm:w-64 space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-stone-600 mb-0.5">
                        <span>Clarity & Explanation</span>
                        <span className="font-bold text-stone-900">
                          {solution.criteriaBreakdown.clarity.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(solution.criteriaBreakdown.clarity / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-stone-600 mb-0.5">
                        <span>Accuracy / Result</span>
                        <span className="font-bold text-stone-900">
                          {solution.criteriaBreakdown.accuracy.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${(solution.criteriaBreakdown.accuracy / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-stone-600 mb-0.5">
                        <span>Step-by-Step Completeness</span>
                        <span className="font-bold text-stone-900">
                          {solution.criteriaBreakdown.stepByStep.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(solution.criteriaBreakdown.stepByStep / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RATE THIS SOLUTION FORM */}
                <div className="mt-5 pt-4">
                  {hasSubmittedReview ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                      <div className="font-bold text-sm">Thank you for rating this solution!</div>
                      <p className="text-xs text-emerald-700 mt-1">
                        Your feedback has been saved and the solution quality score has been recalculated.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>Rate & Review this Explanation</span>
                        </h4>
                        <span className="text-[11px] text-stone-400">
                          Posting as {currentUser.name}
                        </span>
                      </div>

                      {/* Interactive Overall Stars */}
                      <div className="flex flex-wrap items-center gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                        <span className="text-xs font-medium text-stone-700">Overall Quality:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              onClick={() => setOverallRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= (hoverRating ?? overallRating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-stone-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-900">
                          {overallRating} of 5 Stars
                        </span>
                      </div>

                      {/* Criteria Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                          <div className="text-xs font-semibold text-stone-800 mb-1">Clarity</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-stone-500">Easy to follow</span>
                            <select
                              value={clarityRating}
                              onChange={(e) => setClarityRating(Number(e.target.value))}
                              className="text-xs bg-white font-bold p-1 rounded border border-stone-200 text-stone-800"
                            >
                              <option value={5}>5 ★ (Flawless)</option>
                              <option value={4}>4 ★ (Very clear)</option>
                              <option value={3}>3 ★ (Decent)</option>
                              <option value={2}>2 ★ (Hard to read)</option>
                              <option value={1}>1 ★ (Confusing)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                          <div className="text-xs font-semibold text-stone-800 mb-1">Accuracy</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-stone-500">Correct result</span>
                            <select
                              value={accuracyRating}
                              onChange={(e) => setAccuracyRating(Number(e.target.value))}
                              className="text-xs bg-white font-bold p-1 rounded border border-stone-200 text-stone-800"
                            >
                              <option value={5}>5 ★ (100% correct)</option>
                              <option value={4}>4 ★ (Minor typo)</option>
                              <option value={3}>3 ★ (Right idea)</option>
                              <option value={2}>2 ★ (Flawed math)</option>
                              <option value={1}>1 ★ (Incorrect)</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                          <div className="text-xs font-semibold text-stone-800 mb-1">Step-by-Step</div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-stone-500">No steps skipped</span>
                            <select
                              value={stepRating}
                              onChange={(e) => setStepRating(Number(e.target.value))}
                              className="text-xs bg-white font-bold p-1 rounded border border-stone-200 text-stone-800"
                            >
                              <option value={5}>5 ★ (Every step)</option>
                              <option value={4}>4 ★ (Good pace)</option>
                              <option value={3}>3 ★ (Skipped some)</option>
                              <option value={2}>2 ★ (Too rushed)</option>
                              <option value={1}>1 ★ (Answers only)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Quick Feedback Tags */}
                      <div>
                        <div className="text-xs font-semibold text-stone-700 mb-1.5">
                          What made this explanation helpful? (Click to tag)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {FEEDBACK_TAGS.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                              <button
                                type="button"
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium border ${
                                  isSelected
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Comment text area */}
                      <div>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Write constructive peer feedback (e.g., 'The triangle diagram on step 2 cleared up my confusion with limits...')"
                          rows={3}
                          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white text-stone-900"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Submit Rating & Review</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* LIST OF EXISTING REVIEWS */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm flex items-center justify-between">
                  <span>Student Community Reviews ({solution.reviews.length})</span>
                </h4>

                {solution.reviews.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
                    No written reviews yet. Be the first to provide feedback!
                  </div>
                ) : (
                  solution.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={getStudentAvatar(rev.authorName, rev.authorAvatar)}
                            alt={rev.authorName}
                            className="w-7 h-7 rounded-full object-cover aspect-square"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-xs text-stone-900">
                              {rev.authorName || 'Student Peer'}
                            </span>
                            <span className="text-[10px] text-stone-400 ml-2">
                              {rev.createdAt}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs font-bold text-amber-900">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{rev.rating} ★</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                        {rev.feedbackText}
                      </p>

                      {/* Tags */}
                      {rev.helpfulTags && rev.helpfulTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rev.helpfulTags.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            {solution.isVerified ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Verified peer accuracy
              </span>
            ) : (
              <span>Peer-reviewed community solution</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
          >
            Close Solution
          </button>
        </div>
      </div>
    </div>
  );
}
