import { useState, useRef } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Link as LinkIcon, 
  Clock,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyMaterial, SolutionMediaType, SolutionStep, VideoTimestamp, UserProfile } from '../types';

interface PostSolutionModalProps {
  material: StudyMaterial | null;
  onClose: () => void;
  onSubmitSolution: (newSolutionData: {
    materialId: string;
    materialTitle: string;
    title: string;
    solutionType: SolutionMediaType;
    mediaUrl: string;
    fileName?: string;
    fileSize?: string;
    videoDuration?: string;
    videoTimestamps?: VideoTimestamp[];
    imageCaption?: string;
    steps: SolutionStep[];
    keyTakeaway: string;
    toolsUsed: string[];
    author: {
      name: string;
      avatar: string;
      gradeLevel?: string;
      reputation: number;
    };
  }) => void;
  currentUser: UserProfile;
}

const COMMON_TOOLS = [
  'Excel / Google Sheets',
  'Financial Calculator (Casio/HP)',
  'TallyPrime / ERP Ledger',
  'Handwritten Ledger Notes',
  'GoodNotes / iPad Working Notes',
  'LaTeX / Formatted Doc',
  'Loom Video Walkthrough',
  'Notion Study Hub',
];

export default function PostSolutionModal({
  material,
  onClose,
  onSubmitSolution,
  currentUser,
}: PostSolutionModalProps) {
  if (!material) return null;

  const [solutionType, setSolutionType] = useState<SolutionMediaType>('pdf');
  const [title, setTitle] = useState('');
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [toolsUsed, setToolsUsed] = useState<string[]>(['Excel / Google Sheets']);

  // File / Media states
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [videoDuration, setVideoDuration] = useState('3:45');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps state
  const [steps, setSteps] = useState<SolutionStep[]>([
    {
      stepNumber: 1,
      title: 'Identify Accounting Principles & Working Notes',
      explanation: 'List the relevant accounts, rules (Debit the receiver, Credit the giver / AS provisions), and initial working computations.',
      formulaOrSnippet: '',
    },
    {
      stepNumber: 2,
      title: 'Execute Ledger T-Accounts / Journal Entries',
      explanation: 'Complete double-entry postings with clear narrations and balance the trial figures.',
      formulaOrSnippet: '',
    },
  ]);

  // Handle local file upload
  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
        setSolutionType('image');
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
        setSolutionType('pdf');
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setSolutionType('video');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const toggleTool = (tool: string) => {
    setToolsUsed((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        title: `Step ${prev.length + 1}`,
        explanation: '',
        formulaOrSnippet: '',
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, idx) => idx !== index).map((st, i) => ({
      ...st,
      stepNumber: i + 1,
    }));
    setSteps(updated);
  };

  const updateStep = (index: number, field: keyof SolutionStep, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback media URL if not uploaded
    let finalMediaUrl = mediaUrl;
    if (!finalMediaUrl) {
      if (solutionType === 'pdf') {
        finalMediaUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else if (solutionType === 'image') {
        finalMediaUrl = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000';
      } else {
        finalMediaUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      }
    }

    const newSolution = {
      materialId: material.id,
      materialTitle: material.title,
      title: title.trim() || `Step-by-Step ${solutionType.toUpperCase()} Solution`,
      solutionType,
      mediaUrl: finalMediaUrl,
      fileName: fileName || `${currentUser.name.replace(/\s+/g, '_')}_Solution.${solutionType === 'pdf' ? 'pdf' : solutionType === 'image' ? 'png' : 'mp4'}`,
      fileSize: fileSize || (solutionType === 'pdf' ? '1.1 MB' : solutionType === 'image' ? '750 KB' : '14 MB'),
      videoDuration: solutionType === 'video' ? videoDuration : undefined,
      videoTimestamps:
        solutionType === 'video'
          ? [
              { timeInSeconds: 0, timeDisplay: '0:00', label: 'Problem Setup & Diagram' },
              { timeInSeconds: 45, timeDisplay: '0:45', label: 'Step 1: Formula Derivation' },
              { timeInSeconds: 120, timeDisplay: '2:00', label: 'Final Answer & Summary' },
            ]
          : undefined,
      imageCaption: solutionType === 'image' ? imageCaption || 'Handwritten student notes' : undefined,
      steps: steps.map((s) => ({
        ...s,
        title: s.title || `Step ${s.stepNumber}`,
        explanation: s.explanation || 'Detailed step explanation provided in the attached file.',
      })),
      keyTakeaway: keyTakeaway.trim() || 'Always verify that total debit balances equal total credit balances and reconcile bank entries before finalizing.',
      toolsUsed,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        gradeLevel: currentUser.gradeLevel,
        reputation: currentUser.points,
        uid: currentUser.authUid || currentUser.id,
      },
      authorUid: currentUser.authUid || currentUser.id,
    };

    onSubmitSolution(newSolution);

    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
              StudySolve Solution Studio
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
              Post Solution for: {material.title}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity & Multi-Student Answering Notice */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-900">
                Answering as: {currentUser.name} (Student ID: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-[11px]">{currentUser.authUid ? currentUser.authUid.slice(0, 10) + '...' : currentUser.id}</code>)
              </div>
              <div className="text-blue-700 text-[11px] mt-0.5">
                Every member in this group can answer this question with their own steps, calculations, and preferred media format.
              </div>
            </div>
          </div>

          {/* STEP 1: SOLUTION FORMAT SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              1. Choose Solution Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSolutionType('pdf')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  solutionType === 'pdf'
                    ? 'bg-rose-50/80 border-rose-400 text-rose-950 ring-2 ring-rose-200 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className={`w-5 h-5 ${solutionType === 'pdf' ? 'text-rose-600' : 'text-stone-400'}`} />
                  {solutionType === 'pdf' && <Check className="w-4 h-4 text-rose-600 font-bold" />}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">PDF Document</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Typed LaTeX or scanned multi-page notes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSolutionType('image')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  solutionType === 'image'
                    ? 'bg-amber-50/80 border-amber-400 text-amber-950 ring-2 ring-amber-200 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ImageIcon className={`w-5 h-5 ${solutionType === 'image' ? 'text-amber-600' : 'text-stone-400'}`} />
                  {solutionType === 'image' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">Image / Notes</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Handwritten notes, diagram photo, or screenshot</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSolutionType('video')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  solutionType === 'video'
                    ? 'bg-purple-50/80 border-purple-400 text-purple-950 ring-2 ring-purple-200 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Video className={`w-5 h-5 ${solutionType === 'video' ? 'text-purple-600' : 'text-stone-400'}`} />
                  {solutionType === 'video' && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">Video Walkthrough</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">Spoken audio explanation or screen recording</div>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: FILE UPLOAD OR URL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                2. Upload or Attach {solutionType.toUpperCase()} Solution
              </label>
              <span className="text-[11px] text-stone-400">PDF, PNG, JPG, or MP4</span>
            </div>

            {/* Drag and drop upload target */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-stone-300 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={
                  solutionType === 'pdf'
                    ? '.pdf'
                    : solutionType === 'image'
                    ? 'image/*'
                    : 'video/*,.mp4'
                }
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center text-stone-600">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>

                {fileName ? (
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-emerald-800 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{fileName}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {fileSize} • Click to replace file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-stone-800">
                      Drag & drop your {solutionType.toUpperCase()} file here, or{' '}
                      <span className="text-blue-600 underline">browse computer</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Or use sample verified study template if testing
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video-specific fields (Duration) */}
            {solutionType === 'video' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Estimated Duration:
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="e.g. 4:30"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Direct Video URL (Optional):
                  </label>
                  <input
                    type="url"
                    value={mediaUrl.startsWith('data:') || mediaUrl.startsWith('blob:') ? '' : mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: TITLE & KEY TAKEAWAY */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
              3. Solution Title & Key Takeaway
            </label>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Solution Headline (e.g. 'Complete Realisation Account & Partner Capital Accounts with Working Notes')"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <textarea
                value={keyTakeaway}
                onChange={(e) => setKeyTakeaway(e.target.value)}
                placeholder="Key Accounting Concept or Pro Tip (e.g., 'Ensure goodwill treatment conforms to latest AS-26 standards and verify the cash balance matches!')"
                rows={2}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-200 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* STEP 4: STEP-BY-STEP BREAKDOWN BUILDER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                4. Step-by-Step Walkthrough
              </label>
              <button
                type="button"
                onClick={addStep}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-stone-800">
                      Step {st.stepNumber}
                    </span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => updateStep(idx, 'title', e.target.value)}
                    placeholder="Step Title (e.g. 'Choice of Coordinate Axes')"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200"
                  />

                  <textarea
                    value={st.explanation}
                    onChange={(e) => updateStep(idx, 'explanation', e.target.value)}
                    placeholder="Explanation of logic, assumptions, and work..."
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200"
                  />

                  <input
                    type="text"
                    value={st.formulaOrSnippet || ''}
                    onChange={(e) => updateStep(idx, 'formulaOrSnippet', e.target.value)}
                    placeholder="Optional math/code snippet: e.g. x = 2 tan(θ), dx = 2 sec²(θ) dθ"
                    className="w-full text-xs p-2 rounded-lg bg-white border border-stone-200 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* STEP 5: TOOLS USED */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              5. Tools Used (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TOOLS.map((tool) => {
                const isSelected = toolsUsed.includes(tool);
                return (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`text-xs px-3 py-1 rounded-xl transition-colors font-medium border ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tool}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
            <div className="text-xs text-stone-400">
              Will be published to <strong>{material.groupName}</strong>
            </div>

            <div className="flex items-center gap-2">
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
                <span>Publish Solution</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
