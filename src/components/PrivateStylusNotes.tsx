import { useState, useRef, useEffect, useCallback, PointerEvent } from 'react';
import { 
  PenTool, 
  Eraser, 
  Highlighter, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Download, 
  Maximize2, 
  Minimize2, 
  X, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Grid3X3, 
  AlignJustify, 
  FileText, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  points: StrokePoint[];
}

interface NotePage {
  id: string;
  title: string;
  strokes: Stroke[];
  textNotes: string;
  background: 'blank' | 'lined' | 'grid' | 'dotted';
}

const STORAGE_KEY = 'studysolve_private_stylus_notes_v1';

const COLOR_PALETTE = [
  { name: 'Ink Black', hex: '#1c1917' },
  { name: 'Navy Blue', hex: '#1e40af' },
  { name: 'Emerald', hex: '#047857' },
  { name: 'Crimson', hex: '#b91c1c' },
  { name: 'Purple', hex: '#6d28d9' },
  { name: 'Amber', hex: '#b45309' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Cyan', hex: '#38bdf8' },
  { name: 'Neon Green', hex: '#4ade80' },
  { name: 'Coral Pink', hex: '#fb7185' },
];

const PEN_SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Bold', value: 7 },
  { label: 'Marker', value: 14 },
];

export default function PrivateStylusNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'text' | 'split'>('canvas');
  
  // Multi-page state - 'blank' paper is default
  const [pages, setPages] = useState<NotePage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'page-1',
        title: 'Problem Working 1',
        strokes: [],
        textNotes: '',
        background: 'blank',
      },
    ];
  });

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Active tools
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState('#1c1917');
  const [highlighterColor, setHighlighterColor] = useState('#facc15');
  const [penSize, setPenSize] = useState(3);
  const [highlighterSize, setHighlighterSize] = useState(18);
  const [eraserSize, setEraserSize] = useState(16);
  
  // Stylus Palm Rejection Mode: only accept PointerType === 'pen'
  const [stylusOnlyMode, setStylusOnlyMode] = useState(false);

  // Undo / Redo stacks
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [clearedNotification, setClearedNotification] = useState(false);

  // Global event listener so Header or other components can open Private Notes on mobile & desktop
  useEffect(() => {
    const handleOpenNotes = () => setIsOpen(true);
    window.addEventListener('open-private-notes', handleOpenNotes);
    return () => window.removeEventListener('open-private-notes', handleOpenNotes);
  }, []);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const currentPage = pages[currentPageIndex] || pages[0];

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      console.warn('Could not save notes to local storage', e);
    }
  }, [pages]);

  // Set up high-res canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Adjust internal resolution to match display size
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Draw paper pattern background
    const bg = currentPage.background;
    if (bg === 'lined') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      const lineSpacing = 28;
      for (let y = lineSpacing; y < rect.height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
    } else if (bg === 'grid') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      const gridSize = 24;
      for (let x = gridSize; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = gridSize; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
    } else if (bg === 'dotted') {
      ctx.fillStyle = '#cbd5e1';
      const dotSpacing = 22;
      for (let x = dotSpacing; x < rect.width; x += dotSpacing) {
        for (let y = dotSpacing; y < rect.height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw all existing strokes
    for (const stroke of currentPage.strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.size;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw in-progress stroke
    if (isDrawingRef.current && currentStrokeRef.current) {
      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'highlighter') {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
        } else if (stroke.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = stroke.size;
        } else {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size;
        }

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }, [currentPage]);

  // Re-render when open, page changes, or resized
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        renderCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentPageIndex, isFullScreen, activeTab, renderCanvas]);

  useEffect(() => {
    const handleResize = () => {
      if (isOpen) renderCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, renderCanvas]);

  // Pointer event handlers with pressure & stylus optimization
  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    // Palm rejection check
    if (stylusOnlyMode && e.pointerType !== 'pen') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    let size = penSize;
    let color = penColor;

    if (currentTool === 'highlighter') {
      size = highlighterSize;
      color = highlighterColor;
    } else if (currentTool === 'eraser') {
      size = eraserSize;
    }

    currentStrokeRef.current = {
      tool: currentTool,
      color,
      size,
      points: [{ x, y, pressure }],
    };

    renderCanvas();
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    if (stylusOnlyMode && e.pointerType !== 'pen') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    currentStrokeRef.current.points.push({ x, y, pressure });
    renderCanvas();
  };

  const finishStroke = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;

    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    if (completedStroke.points.length > 0) {
      // Save for Undo history
      setHistory((prev) => [...prev, currentPage.strokes]);
      setRedoStack([]); // clear redo on new stroke

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === currentPageIndex
            ? { ...p, strokes: [...p.strokes, completedStroke] }
            : p
        )
      );
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    finishStroke();
  };

  const handlePointerCancel = () => {
    finishStroke();
  };

  // Undo
  const handleUndo = () => {
    if (currentPage.strokes.length === 0) return;
    const lastStrokes = currentPage.strokes;
    const updated = lastStrokes.slice(0, -1);

    setRedoStack((prev) => [...prev, lastStrokes]);
    setPages((prev) =>
      prev.map((p, idx) => (idx === currentPageIndex ? { ...p, strokes: updated } : p))
    );
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextStrokes = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    setPages((prev) =>
      prev.map((p, idx) => (idx === currentPageIndex ? { ...p, strokes: nextStrokes } : p))
    );
  };

  // Clear current page (deletes the entire written page instantly)
  const handleClearPage = () => {
    // Save to undo history before clearing
    if (currentPage.strokes.length > 0) {
      setHistory((prev) => [...prev, currentPage.strokes]);
      setRedoStack([]);
    }

    // 1. Clear strokes and text notes
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPageIndex ? { ...p, strokes: [], textNotes: '' } : p
      )
    );

    // 2. Clear HTML5 canvas buffer immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // 3. Re-render background immediately
    setTimeout(() => {
      renderCanvas();
    }, 10);

    setClearedNotification(true);
    setTimeout(() => setClearedNotification(false), 2000);
  };

  // Page management - default 'blank' paper
  const handleAddPage = () => {
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      title: `Problem Working ${pages.length + 1}`,
      strokes: [],
      textNotes: '',
      background: 'blank',
    };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    setHistory([]);
    setRedoStack([]);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) {
      handleClearPage();
      return;
    }
    const updated = pages.filter((_, idx) => idx !== currentPageIndex);
    setPages(updated);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    setHistory([]);
    setRedoStack([]);
  };

  // Export as PNG
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create an export canvas with white background so transparency is rendered nicely
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    expCtx.fillStyle = '#ffffff';
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    expCtx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${currentPage.title.toLowerCase().replace(/\s+/g, '_')}_notes.png`;
    a.click();
  };

  // Copy PNG to clipboard
  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    expCtx.fillStyle = '#ffffff';
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    expCtx.drawImage(canvas, 0, 0);

    try {
      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2500);
      });
    } catch (e) {
      console.warn('Clipboard copy error:', e);
      handleExportPng();
    }
  };

  // Change background pattern - starts with blank paper
  const handleCycleBackground = () => {
    const bgs: ('blank' | 'lined' | 'grid' | 'dotted')[] = ['blank', 'lined', 'grid', 'dotted'];
    const currentIdx = bgs.indexOf(currentPage.background);
    const nextBg = bgs[(currentIdx + 1) % bgs.length];

    setPages((prev) =>
      prev.map((p, idx) => (idx === currentPageIndex ? { ...p, background: nextBg } : p))
    );
  };

  return (
    <>
      {/* Floating Trigger Bubble in place of AI Assistant - circular rectangle with iPhone transparent glass theme */}
      {!isOpen && (
        <aside aria-label="Private Stylus Notes" className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end pointer-events-none">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto group relative flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl sm:rounded-3xl bg-white/20 dark:bg-stone-900/30 backdrop-blur-2xl border border-white/50 dark:border-white/15 shadow-xl shadow-black/10 hover:bg-white/30 dark:hover:bg-stone-900/45 hover:scale-[1.03] active:scale-95 transition-all duration-200 focus:outline-hidden cursor-pointer overflow-hidden"
            title="Private Stylus Notes & Scratchpad"
          >
            {/* iPhone Glass Specular Highlight Sheen */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />

            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600/90 to-blue-500/90 border border-white/40 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400"></span>
              </span>
            </div>

            <div className="relative text-left leading-tight hidden xs:block sm:block pr-1 select-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold block text-stone-900 dark:text-white drop-shadow-xs">
                  Private Notes
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 font-semibold backdrop-blur-xs">
                  Stylus
                </span>
              </div>
              <span className="text-[10px] text-stone-700/80 dark:text-stone-300/80 block font-medium">
                Solve questions privately
              </span>
            </div>
          </button>
        </aside>
      )}

      {/* Main Stylus Scratchpad Window - iPhone glass circular rectangle */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl shadow-2xl border border-stone-200/80 dark:border-stone-700/80 overflow-hidden ${
            isFullScreen
              ? 'inset-2 sm:inset-4 rounded-2xl sm:rounded-3xl'
              : 'bottom-3 right-3 sm:bottom-5 sm:right-5 w-[calc(100vw-1.5rem)] sm:w-[580px] h-[640px] max-h-[88vh] rounded-3xl'
          }`}
        >
          {/* Top Header Bar */}
          <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0 border-b border-stone-800">
            {/* Title & Privacy Badge */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <PenTool className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                    Private Stylus Scratchpad
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Private
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 truncate">
                  Solve problems privately • 100% on your device
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Canvas'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                title="Close Notes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Secondary Toolbar: Pages & Tools */}
          <div className="px-3 sm:px-4 py-2 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
            {/* Page Navigator */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPageIndex <= 0}
                onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-stone-700 dark:text-stone-300 px-1 select-none">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <button
                type="button"
                disabled={currentPageIndex >= pages.length - 1}
                onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                className="p-1 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAddPage}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 font-medium text-stone-800 dark:text-stone-200 transition-colors"
                title="Add New Blank Page"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Page</span>
              </button>
              {pages.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeletePage}
                  className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                  title="Delete This Page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Canvas vs Text vs Split */}
            <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-700/80 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('canvas')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'canvas'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Stylus Canvas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Typed Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('split')}
                className={`hidden sm:block px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'split'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                Split View
              </button>
            </div>

            {/* Stylus Palm Rejection toggle */}
            <button
              type="button"
              onClick={() => setStylusOnlyMode(!stylusOnlyMode)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                stylusOnlyMode
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/40'
                  : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
              title="When enabled, only pen/stylus input is accepted (rejects accidental palm or finger touches on tablets)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{stylusOnlyMode ? 'Stylus Only (Palm Rejection On)' : 'All Touch / Pen'}</span>
            </button>
          </div>

          {/* Canvas Tools Toolbar (Pen, Highlighter, Eraser, Colors, Background) */}
          {(activeTab === 'canvas' || activeTab === 'split') && (
            <div className="px-3 sm:px-4 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Tool Selector */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentTool('pen')}
                  className={`p-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-colors ${
                    currentTool === 'pen'
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Ballpoint / Gel Pen"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTool('highlighter')}
                  className={`p-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-colors ${
                    currentTool === 'highlighter'
                      ? 'bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-500'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Marker Highlighter"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Highlight</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTool('eraser')}
                  className={`p-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-colors ${
                    currentTool === 'eraser'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                  title="Stroke Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Eraser</span>
                </button>
              </div>

              {/* Color Swatches */}
              {currentTool === 'pen' && (
                <div className="flex items-center gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPenColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        penColor === c.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              {currentTool === 'highlighter' && (
                <div className="flex items-center gap-1.5">
                  {HIGHLIGHTER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setHighlighterColor(c.hex)}
                      className={`w-6 h-6 rounded-full border border-stone-300 transition-transform ${
                        highlighterColor === c.hex ? 'scale-125 ring-2 ring-amber-500 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              {/* Stroke Size Chips */}
              <div className="flex items-center gap-1">
                {currentTool === 'pen' &&
                  PEN_SIZES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setPenSize(s.value)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        penSize === s.value
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                          : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>

              {/* Paper Grid Pattern Selector */}
              <div className="flex items-center gap-1 border-l border-stone-200 dark:border-stone-700 pl-2">
                <button
                  type="button"
                  onClick={handleCycleBackground}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
                  title="Switch between Grid, Ruled lines, Dotted, or Blank sheet"
                >
                  <Grid3X3 className="w-3.5 h-3.5 text-stone-400" />
                  <span className="capitalize">{currentPage.background} Paper</span>
                </button>
              </div>

              {/* History: Undo / Redo & Actions */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={currentPage.strokes.length === 0}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClearPage}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    clearedNotification
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 ring-1 ring-rose-400'
                      : 'hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600'
                  }`}
                  title="Delete Entire Written Page (Clear All Drawings & Notes)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Copy Page Image to Clipboard"
                >
                  {copiedNotification ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleExportPng}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Download Page as PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Canvas & Text Notes Content Body */}
          <div className="flex-1 min-h-0 relative flex overflow-hidden">
            {/* Drawing Canvas Area */}
            {(activeTab === 'canvas' || activeTab === 'split') && (
              <div className={`relative h-full flex-1 bg-white select-none touch-none ${activeTab === 'split' ? 'border-r border-stone-200 dark:border-stone-800' : ''}`}>
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  className="w-full h-full cursor-crosshair touch-none"
                  style={{ touchAction: 'none' }}
                />

                {/* Gentle guidance overlay when canvas is blank */}
                {currentPage.strokes.length === 0 && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-stone-400 dark:text-stone-500">
                    <PenTool className="w-8 h-8 mb-2 text-stone-300 dark:text-stone-600" />
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      Private Stylus Sheet
                    </p>
                    <p className="text-[11px] max-w-xs mt-1 text-stone-400 dark:text-stone-500">
                      Use a stylus or pen to solve math, ledger accounts, and formulas privately. Everything auto-saves.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Typed Notes Area */}
            {(activeTab === 'text' || activeTab === 'split') && (
              <div className={`h-full flex flex-col bg-stone-50/60 dark:bg-stone-900/60 p-4 ${activeTab === 'split' ? 'w-1/2' : 'flex-1'}`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Typed Working & Equations
                  </span>
                  <span className="text-[10px] text-stone-400">Auto-saved locally</span>
                </div>
                <textarea
                  value={currentPage.textNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPages((prev) =>
                      prev.map((p, idx) => (idx === currentPageIndex ? { ...p, textNotes: val } : p))
                    );
                  }}
                  placeholder="Paste question statement, draft debit/credit journal entries, or type formulas here..."
                  className="w-full flex-1 p-3 text-xs bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Bottom Footer Info Bar */}
          <div className="px-4 py-2 bg-stone-100 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Local Scratchpad Auto-saved</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{currentPage.strokes.length} strokes drawn</span>
              <button
                type="button"
                onClick={handleExportPng}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Save Page (PNG)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
