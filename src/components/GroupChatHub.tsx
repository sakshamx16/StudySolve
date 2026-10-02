import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  BookOpen, 
  Users, 
  Crown, 
  Settings, 
  Share2, 
  Send, 
  Smile, 
  Paperclip, 
  Check, 
  CheckCheck, 
  Plus, 
  Search, 
  Filter, 
  Lock, 
  Globe, 
  ChevronRight, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  FileText, 
  Image as ImageIcon,
  MoreVertical,
  X,
  FileQuestion,
  ExternalLink
} from 'lucide-react';
import { StudyGroup, StudyMaterial, Solution, UserProfile, GroupMessage } from '../types';
import { getStudentAvatar } from '../utils/avatar';
import { 
  isRealGroupHost, 
  fetchGroupMessagesFromApi, 
  sendGroupMessageToApi, 
  getStoredGroupMessages, 
  saveStoredGroupMessages 
} from '../utils/storage';
import { subscribeToGroupMessages, sendMessageToFirestore } from '../firebase';
import MaterialCard from './MaterialCard';
import GroupMembersModal from './GroupMembersModal';
import EditGroupModal from './EditGroupModal';

interface GroupChatHubProps {
  group: StudyGroup;
  currentUser: UserProfile;
  materials: StudyMaterial[];
  solutions: Solution[];
  onBack: () => void;
  onOpenCreateMaterial: (defaultGroupId?: string) => void;
  onOpenMaterialDetail: (mat: StudyMaterial) => void;
  onPostSolution: (mat: StudyMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
  onUpdateGroup: (updatedGroup: StudyGroup) => void;
  onOpenInviteModal?: (group: StudyGroup) => void;
}

const QUICK_EMOJIS = ['👍', '💡', '🔥', '👏', '❓', '📚', '💯', '⚖️', '📊', '✅'];

export default function GroupChatHub({
  group,
  currentUser,
  materials,
  solutions,
  onBack,
  onOpenCreateMaterial,
  onOpenMaterialDetail,
  onPostSolution,
  onDeleteMaterial,
  onUpdateGroup,
  onOpenInviteModal,
}: GroupChatHubProps) {
  const isHost = isRealGroupHost(group, currentUser);

  // Sub-view: 'chat' (WhatsApp-style group chat) or 'problems' (dedicated questions & solutions page)
  const [viewMode, setViewMode] = useState<'chat' | 'problems'>('chat');

  // Modals inside group
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState<GroupMessage[]>(() => {
    return getStoredGroupMessages(group.id);
  });
  const [messageText, setMessageText] = useState('');
  const [selectedQuestionToShare, setSelectedQuestionToShare] = useState<StudyMaterial | null>(null);

  // Problems filter inside group
  const [problemSearch, setProblemSearch] = useState('');
  const [problemDifficulty, setProblemDifficulty] = useState<string>('All');
  const [problemStatus, setProblemStatus] = useState<'all' | 'solved' | 'unsolved'>('all');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter materials belonging to this group
  const groupMaterials = materials.filter((m) => m.groupId === group.id);

  // Scroll to bottom of chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Initial messages fetch & local cache
  useEffect(() => {
    if (!group?.id) return;
    const cached = getStoredGroupMessages(group.id);
    if (cached.length > 0) {
      setMessages(cached);
    }

    fetchGroupMessagesFromApi(group.id).then((serverMsgs) => {
      if (serverMsgs && serverMsgs.length > 0) {
        setMessages(serverMsgs);
        saveStoredGroupMessages(group.id, serverMsgs);
      }
    });

    // 2. Real-time Firestore sync for group chat
    const unsub = subscribeToGroupMessages(group.id, (liveMessages) => {
      if (liveMessages && Array.isArray(liveMessages)) {
        setMessages(liveMessages);
        saveStoredGroupMessages(group.id, liveMessages);
      }
    });

    return () => {
      unsub();
    };
  }, [group.id]);

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom('auto');
    }
  }, [viewMode, messages.length]);

  // Send a message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = messageText.trim();
    if (!textToSend && !selectedQuestionToShare) return;

    const currentUid = currentUser.authUid || currentUser.id || 'usr-peer';
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: GroupMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      groupId: group.id,
      senderUid: currentUid,
      senderName: currentUser.name || (isHost ? group.leaderName : 'Student Peer'),
      senderAvatar: currentUser.avatar,
      isHost,
      text: textToSend,
      timestamp: timeFormatted,
      createdAtMs: Date.now(),
      attachment: selectedQuestionToShare
        ? {
            type: 'question',
            title: selectedQuestionToShare.title,
            id: selectedQuestionToShare.id,
          }
        : undefined,
      reactions: {},
    };

    // Optimistic update
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      saveStoredGroupMessages(group.id, updated);
      return updated;
    });

    setMessageText('');
    setSelectedQuestionToShare(null);
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
    scrollToBottom();

    // Background sync to server and Firestore
    sendGroupMessageToApi(newMsg).catch(() => {});
    sendMessageToFirestore(newMsg).catch(() => {});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add emoji reaction
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const currentUid = currentUser.authUid || currentUser.id || 'usr-peer';

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        const usersList = currentReactions[emoji] || [];

        if (usersList.includes(currentUid)) {
          // Remove reaction
          currentReactions[emoji] = usersList.filter((u) => u !== currentUid);
          if (currentReactions[emoji].length === 0) {
            delete currentReactions[emoji];
          }
        } else {
          // Add reaction
          currentReactions[emoji] = [...usersList, currentUid];
        }

        const updatedMsg = { ...msg, reactions: currentReactions };
        sendGroupMessageToApi(updatedMsg).catch(() => {});
        sendMessageToFirestore(updatedMsg).catch(() => {});
        return updatedMsg;
      })
    );
  };

  // Filtered problems for this group
  const filteredGroupMaterials = groupMaterials.filter((m) => {
    if (problemSearch.trim()) {
      const q = problemSearch.toLowerCase();
      const match =
        m.title.toLowerCase().includes(q) ||
        m.topic.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (problemDifficulty !== 'All' && m.difficulty !== problemDifficulty) {
      return false;
    }
    if (problemStatus === 'solved' && !m.isSolved) {
      return false;
    }
    if (problemStatus === 'unsolved' && m.isSolved) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-7xl mx-auto px-2 sm:px-4 pb-4 animate-in fade-in duration-200">
      {/* WhatsApp-Style Top App Bar / Group Header Menu */}
      <header className="px-3 sm:px-5 py-3 bg-stone-900 text-white rounded-2xl shadow-md border border-stone-800 flex items-center justify-between gap-3 shrink-0 mb-3">
        {/* Left: Back Arrow + Group Avatar + Group Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-xl hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Study Circles"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Group Avatar & Click to view Info */}
          <div
            onClick={() => setIsMembersModalOpen(true)}
            className="flex items-center gap-3 cursor-pointer group/title min-w-0"
            title="Click to view Circle Info & Members"
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-stone-800 to-stone-700 border border-stone-600 flex items-center justify-center text-xl sm:text-2xl shadow-inner group-hover/title:scale-105 transition-transform shrink-0">
                {group.badgeEmoji || '📚'}
              </div>
              {group.privacy === 'private' ? (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] ring-2 ring-stone-900">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              ) : (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] ring-2 ring-stone-900">
                  <Globe className="w-2.5 h-2.5" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-white truncate group-hover/title:text-blue-300 transition-colors">
                  {group.name}
                </h2>
                {isHost && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                    <Crown className="w-2.5 h-2.5 text-amber-400" />
                    Host
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 truncate flex items-center gap-1.5">
                <span>{group.memberCount} members</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Tap for circle info</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Menu Actions: "View Problems", Members, Host Edit, More */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* THE PROMINENT "VIEW PROBLEMS" BUTTON (inside group) */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'problems' ? 'chat' : 'problems')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              viewMode === 'problems'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/30'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:scale-[1.02]'
            }`}
            title="View all problem sets and peer solutions for this circle"
          >
            <BookOpen className="w-4 h-4" />
            <span>{viewMode === 'problems' ? 'Group Chat' : 'View Problems'}</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-extrabold ml-0.5">
              {groupMaterials.length}
            </span>
          </button>

          {/* Members Button */}
          <button
            type="button"
            onClick={() => setIsMembersModalOpen(true)}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="View Group Members"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Edit Group Button (Host only!) */}
          {isHost && (
            <button
              type="button"
              onClick={() => setIsEditGroupModalOpen(true)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-amber-950/60 text-amber-300 hover:text-amber-200 border border-amber-500/20 transition-colors cursor-pointer"
              title="Edit Group Settings (Host only)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Invite Peers */}
          {onOpenInviteModal && (
            <button
              type="button"
              onClick={() => onOpenInviteModal(group)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Share Invite Link & Code"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Invite</span>
            </button>
          )}

          {/* Dropdown Options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGroupMenu(!showGroupMenu)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showGroupMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs text-stone-700 dark:text-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupMenu(false);
                    setIsMembersModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>View Members ({group.memberCount})</span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupMenu(false);
                      setIsEditGroupModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold"
                  >
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Edit Circle Settings</span>
                  </button>
                )}

                {onOpenInviteModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowGroupMenu(false);
                      onOpenInviteModal(group);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4 text-emerald-500" />
                    <span>Invite Friends via Code</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowGroupMenu(false);
                    setViewMode('problems');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Problem Sets ({groupMaterials.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* VIEW MODE 1: WHATSAPP-STYLE GROUP CHAT */}
      {viewMode === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#efeae2] dark:bg-[#0b141a] rounded-3xl border border-stone-300 dark:border-stone-800 shadow-md overflow-hidden relative">
          {/* Subtle WhatsApp-style academic doodle texture wallpaper */}
          <div 
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, #efeae2 1px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          {/* Chat Messages Feed */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 z-10"
          >
            {/* Circle Greeting Card */}
            <div className="mx-auto max-w-md p-4 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs border border-stone-200/80 dark:border-stone-800 shadow-xs text-center space-y-1.5 my-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-xs text-xl">
                {group.badgeEmoji || '📚'}
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                Welcome to {group.name} Chat!
              </h3>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                {group.description || 'Collaborative circle for peer discussion and step-by-step problem solving.'}
              </p>
              <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-stone-500 dark:text-stone-400">
                <span>Subject: <strong>{group.subject}</strong></span>
                <span>•</span>
                <span>Host: <strong>{group.leaderName}</strong></span>
              </div>
            </div>

            {/* Date separator */}
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-stone-800/80 backdrop-blur-xs text-[10px] font-semibold text-stone-500 dark:text-stone-400 shadow-2xs border border-stone-200/60 dark:border-stone-700/60 uppercase tracking-wider">
                Today
              </span>
            </div>

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="p-8 text-center text-stone-500 dark:text-stone-400">
                <p className="text-xs font-semibold">No messages in this circle yet.</p>
                <p className="text-[11px] mt-1 text-stone-400">
                  Say hi to your study peers, ask a homework doubt, or share a question!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const currentUid = currentUser.authUid || currentUser.id || 'usr-peer';
                const isSentByMe = msg.senderUid === currentUid;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} group/msg`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                      {/* Avatar for incoming messages */}
                      {!isSentByMe && (
                        <img
                          src={getStudentAvatar(msg.senderName, msg.senderAvatar)}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-200 shrink-0 mb-1"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 shadow-xs relative text-xs leading-relaxed ${
                          isSentByMe
                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-stone-900 dark:text-stone-100 rounded-br-2xs border border-emerald-200/50 dark:border-emerald-800/40'
                            : 'bg-white dark:bg-[#202c33] text-stone-900 dark:text-stone-100 rounded-bl-2xs border border-stone-200/70 dark:border-stone-800'
                        }`}
                      >
                        {/* Sender Name Bar (for others) */}
                        {!isSentByMe && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                              {msg.senderName}
                            </span>
                            {msg.isHost && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-500" />
                                Host
                              </span>
                            )}
                          </div>
                        )}

                        {/* Shared Problem Attachment Card (if present) */}
                        {msg.attachment && msg.attachment.type === 'question' && (
                          <div 
                            onClick={() => {
                              const found = materials.find((m) => m.id === msg.attachment?.id);
                              if (found) onOpenMaterialDetail(found);
                            }}
                            className="mb-2 p-2.5 rounded-xl bg-white/80 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                                <FileQuestion className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block uppercase">
                                  Problem Reference
                                </span>
                                <h5 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                                  {msg.attachment.title}
                                </h5>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          </div>
                        )}

                        {/* Message Text */}
                        {msg.text && (
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                        )}

                        {/* Message Footer: Timestamp + Read Checks */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-400 dark:text-stone-400 select-none">
                          <span>{msg.timestamp}</span>
                          {isSentByMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          )}
                        </div>

                        {/* Reactions Display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                            {Object.entries(msg.reactions).map(([emoji, uids]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border transition-colors ${
                                  uids.includes(currentUid)
                                    ? 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                                    : 'bg-white/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Reactions Bar on Hover */}
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 px-2 pt-0.5">
                      {['👍', '💡', '🔥', '❤️'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, em)}
                          className="hover:scale-125 transition-transform text-xs"
                          title={`React with ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached Question Preview Chip above Input Bar */}
          {selectedQuestionToShare && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/80 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 text-xs z-20 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileQuestion className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-blue-900 dark:text-blue-200">Sharing question: </span>
                  <span className="text-blue-700 dark:text-blue-300">{selectedQuestionToShare.title}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuestionToShare(null)}
                className="p-1 text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Emoji Bar (Collapsible) */}
          {showEmojiPicker && (
            <div className="px-4 py-2 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto z-20">
              <span className="text-[10px] text-stone-400 font-medium shrink-0">Tap to insert:</span>
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setMessageText((prev) => prev + em);
                  }}
                  className="text-lg hover:scale-125 transition-transform px-1"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Attachment Selector Dropdown Menu */}
          {showAttachMenu && (
            <div className="px-4 py-2.5 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 z-20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span>Attach to Circle Chat</span>
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {groupMaterials.length === 0 ? (
                <p className="text-[11px] text-stone-500">
                  No questions uploaded to this circle yet. Post a problem first to share it in chat!
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  <span className="text-[10px] text-stone-400 block mb-1">Pick a question to reference:</span>
                  {groupMaterials.map((mat) => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => {
                        setSelectedQuestionToShare(mat);
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-xs flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="truncate font-medium text-stone-800 dark:text-stone-200">{mat.title}</span>
                      <span className="text-[10px] text-stone-400 shrink-0">{mat.difficulty}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Composer Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 sm:p-3 bg-stone-100 dark:bg-[#202c33] border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 z-20 shrink-0"
          >
            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-colors ${
                showEmojiPicker
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title="Quick Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Attach question / note */}
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`p-2 rounded-xl transition-colors ${
                showAttachMenu
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title="Attach Question from Circle"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${group.name}...`}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#2a3942] text-stone-900 dark:text-stone-100 text-xs sm:text-sm border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!messageText.trim() && !selectedQuestionToShare}
              className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold transition-all shadow-xs flex items-center justify-center cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* VIEW MODE 2: DEDICATED PROBLEMS & SOLUTIONS PAGE FOR THIS GROUP */}
      {viewMode === 'problems' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md overflow-hidden animate-in fade-in duration-200">
          {/* Header inside Problems View */}
          <div className="px-5 py-4 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Group Chat</span>
              </button>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <span>{group.name} Problem Sets</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                    {groupMaterials.length}
                  </span>
                </h3>
              </div>
            </div>

            {/* Post question button */}
            <button
              type="button"
              onClick={() => onOpenCreateMaterial(group.id)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Post Question to this Circle</span>
            </button>
          </div>

          {/* Filter Bar inside Problems View */}
          <div className="px-5 py-3 border-b border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                placeholder="Search problem title, topic..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 text-[11px] font-medium">Difficulty:</span>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProblemDifficulty(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    problemDifficulty === lvl
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProblemStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  problemStatus === 'all'
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setProblemStatus('unsolved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  problemStatus === 'unsolved'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Needs Solution
              </button>
              <button
                type="button"
                onClick={() => setProblemStatus('solved')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  problemStatus === 'solved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                Solved
              </button>
            </div>
          </div>

          {/* Problems List Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {filteredGroupMaterials.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-2xl shadow-xs">
                  {group.badgeEmoji || '📚'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-stone-900 dark:text-white">
                    No Questions Found in {group.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
                    {groupMaterials.length === 0
                      ? 'Be the first student to upload a tricky accounting problem, past exam question, or homework exercise to this circle!'
                      : 'No questions match your current search or difficulty filters.'}
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenCreateMaterial(group.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload First Question</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('chat')}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200"
                  >
                    Return to Group Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroupMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    solutions={solutions}
                    currentUser={currentUser}
                    onOpenDetail={onOpenMaterialDetail}
                    onPostSolution={onPostSolution}
                    onDeleteMaterial={onDeleteMaterial}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {isMembersModalOpen && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          group={group}
          currentUser={currentUser}
          onOpenEditGroup={() => setIsEditGroupModalOpen(true)}
          onOpenInviteModal={onOpenInviteModal}
        />
      )}

      {/* Edit Group Modal (Host only!) */}
      {isEditGroupModalOpen && (
        <EditGroupModal
          isOpen={isEditGroupModalOpen}
          onClose={() => setIsEditGroupModalOpen(false)}
          group={group}
          currentUser={currentUser}
          onUpdateGroup={onUpdateGroup}
        />
      )}
    </div>
  );
}
