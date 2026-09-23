import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  Loader2, 
  Minimize2, 
  Maximize2,
  Trash2,
  HelpCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imagePreview?: string;
  timestamp: string;
}

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hi there! I'm your **StudySolve AI Tutor**. \n\nNeed help solving a tricky assignment or past exam problem? You can **ask questions in text** or **upload a photo/screenshot** of your question, ledger, or handwritten calculation for step-by-step guidance!",
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Handle image attachment
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large. Please select an image smaller than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setSelectedImage({
        base64,
        mimeType: file.type || 'image/jpeg',
        previewUrl: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && !selectedImage) || isLoading) return;

    const userText = prompt.trim();
    const currentImg = selectedImage;

    const newUserMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText || (currentImg ? 'Analyze this problem image and explain step-by-step:' : ''),
      imagePreview: currentImg?.previewUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setPrompt('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Build history for backend API
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          imageBase64: currentImg?.base64,
          imageMimeType: currentImg?.mimeType,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error');
      }

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI Tutor error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Could not connect to AI Tutor**: ${err.message || 'Please verify your network or try again in a moment.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (quickText: string) => {
    setPrompt(quickText);
  };

  return (
    <aside aria-label="AI Study Assistant" className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end pointer-events-none max-w-[calc(100vw-1.5rem)]">
      {/* Collapsed Floating Trigger Bubble with Liquid Glass styling */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-200 border border-white/25 ring-1 ring-white/10 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
          title="Ask AI Study Tutor (Text & Images)"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-300/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
          <div className="text-left leading-tight hidden sm:block pr-1">
            <span className="text-xs font-bold block text-white/95 drop-shadow-xs">AI Study Assistant</span>
            <span className="text-[10px] text-blue-200/90 block">Ask with Text or Photo</span>
          </div>
        </button>
      )}

      {/* Expanded AI Chat Box with Frosted Transparent Liquid Glass */}
      {isOpen && (
        <div 
          className={`pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-[420px] bg-slate-950/45 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-black/10 flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-[62px]' : 'h-[560px] max-h-[82vh]'
          }`}
        >
          {/* Header Bar - Liquid Glass Gradient */}
          <div className="bg-gradient-to-r from-slate-900/60 via-indigo-950/50 to-blue-950/60 backdrop-blur-md px-4 py-3 text-white flex items-center justify-between shrink-0 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-500/25 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-blue-200 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate drop-shadow-xs">StudySolve AI Tutor</h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/25 text-emerald-300 border border-emerald-400/35 font-semibold backdrop-blur-xs shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-blue-200/80 truncate">Instant step-by-step problem solver</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-stone-200 hover:text-white transition-colors"
                title="Close AI Tutor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Container - Transparent Liquid Frosted */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed backdrop-blur-md ${
                        msg.role === 'user'
                          ? 'bg-blue-600/75 text-white rounded-br-xs border border-blue-400/30 shadow-md'
                          : 'bg-white/80 text-stone-900 border border-white/40 rounded-bl-xs shadow-md'
                      }`}
                    >
                      {/* Attached Image in Message with Frosted Glass Border */}
                      {msg.imagePreview && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-white/30 max-h-48 bg-black/10 backdrop-blur-md">
                          <img
                            src={msg.imagePreview}
                            alt="Question context"
                            className="w-full object-contain max-h-48"
                          />
                        </div>
                      )}

                      {/* Text content with simple markdown breaks */}
                      <div className="whitespace-pre-wrap font-sans text-xs break-words">
                        {msg.text}
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-300 mt-1 px-1 drop-shadow-xs">
                      {msg.role === 'user' ? 'You' : 'AI Tutor'} • {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl rounded-bl-xs px-4 py-3 text-stone-800 shadow-md flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-xs font-medium">Analyzing question & calculating working...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Suggestion Pills with Liquid Glass border */}
              {messages.length <= 3 && (
                <div className="p-2.5 bg-slate-900/40 backdrop-blur-md border-t border-white/10 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                  <button
                    onClick={() => handleQuickPrompt('Explain how to balance a Partnership Realization Account step-by-step.')}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20 backdrop-blur-sm"
                  >
                    📐 Partnership Realization
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('What is the formula for Gross Profit Ratio and Operating Ratio?')}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20 backdrop-blur-sm"
                  >
                    📊 Financial Ratios
                  </button>
                  <button
                    onClick={() => handleQuickPrompt('Explain Section 185 and 186 loan provisions under Companies Act.')}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20 backdrop-blur-sm"
                  >
                    ⚖️ Corporate Law
                  </button>
                </div>
              )}

              {/* Input Area - Frosted Liquid Glass */}
              <div className="p-3 bg-slate-900/50 backdrop-blur-lg border-t border-white/15">
                {/* Image Upload Preview with Transparent Liquid Style */}
                {selectedImage && (
                  <div className="mb-2.5 flex items-center justify-between p-2 rounded-xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-xs text-white">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <img
                        src={selectedImage.previewUrl}
                        alt="Upload preview"
                        className="w-10 h-10 object-cover rounded-lg border border-white/30 shrink-0"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-white block truncate">
                          {selectedImage.fileName}
                        </span>
                        <span className="text-[10px] text-blue-200 block">
                          Image attached • Ready to solve
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 rounded-md text-stone-300 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  {/* Image Attachment Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="ai-chat-image-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 rounded-xl border transition-colors shrink-0 backdrop-blur-md ${
                      selectedImage
                        ? 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                        : 'bg-white/15 hover:bg-white/25 text-stone-200 border-white/20'
                    }`}
                    title="Attach problem photo or calculation image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* Text Input - Frosted Glass Look */}
                  <div className="flex-1 relative min-w-0">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        selectedImage
                          ? 'Add instructions or question for this image...'
                          : 'Ask study question or attach photo...'
                      }
                      rows={1}
                      className="w-full resize-none rounded-xl bg-white/15 backdrop-blur-md px-3 py-2 text-xs text-white placeholder:text-stone-300 border border-white/25 focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:bg-white/25 transition-all max-h-24"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!prompt.trim() && !selectedImage) || isLoading}
                    className="p-2 rounded-xl bg-blue-600/90 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md border border-blue-400/30"
                    title="Send Question"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
