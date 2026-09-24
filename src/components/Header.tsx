import { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Users, 
  Sparkles, 
  Award, 
  BookOpen, 
  RotateCcw,
  Menu,
  X,
  ChevronDown,
  UserCog,
  LogIn,
  LogOut,
  Key,
  ShieldCheck,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { StudyGroup, UserProfile } from '../types';
import { getStudentAvatar } from '../utils/avatar';

interface HeaderProps {
  groups: StudyGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'materials' | 'groups' | 'top-solutions' | 'leaderboard';
  onTabChange: (tab: 'materials' | 'groups' | 'top-solutions' | 'leaderboard') => void;
  onOpenShareModal: () => void;
  onOpenCreateGroupModal: () => void;
  user: UserProfile;
  onResetDemoData: () => void;
  onOpenEditProfile: () => void;
  onOpenAuthModal: () => void;
  onSignOut?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function Header({
  groups,
  selectedGroupId,
  onSelectGroup,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onOpenShareModal,
  onOpenCreateGroupModal,
  user,
  onResetDemoData,
  onOpenEditProfile,
  onOpenAuthModal,
  onSignOut,
  theme = 'light',
  onToggleTheme,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Top utility alert or notification strip */}
      <div className="bg-stone-900 dark:bg-black text-stone-200 text-xs px-4 py-1.5 flex items-center justify-between border-b border-stone-800 dark:border-stone-800/80">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> Peer Study Network
          </span>
          <span className="hidden sm:inline text-stone-400">|</span>
          <span className="hidden sm:inline text-stone-300 dark:text-stone-400">
            Share problem sheets, post verified PDF/Image/Video solutions, and rate peer explanations.
          </span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onResetDemoData}
              title="Reset sample data"
              className="text-stone-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Reset Workspace</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-3">
          {/* Logo & Brand - shrink-0 ensures 'StudySolve' is ALWAYS fully visible */}
          <div className="flex items-center gap-1.5 sm:gap-6 shrink-0">
            <button
              onClick={() => {
                onTabChange('materials');
                onSelectGroup(null);
              }}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left group shrink-0 cursor-pointer"
              title="StudySolve - Home"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </div>
              <div className="shrink-0">
                <span className="text-base sm:text-xl font-bold tracking-tight text-stone-900 dark:text-white flex items-center whitespace-nowrap leading-tight">
                  Study<span className="text-blue-600 dark:text-blue-400">Solve</span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block leading-none mt-0.5">
                  Group Study & Solution Exchange
                </p>
              </div>
            </button>

            {/* Group Switcher Dropdown (Desktop) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-800 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/80 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className="truncate max-w-[160px]">
                  {selectedGroup ? selectedGroup.name : 'All Study Groups'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {groupDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setGroupDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-1 w-72 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                      Switch Study Group
                    </div>
                    <button
                      onClick={() => {
                        onSelectGroup(null);
                        setGroupDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                        selectedGroupId === null ? 'bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300' : 'text-stone-700 dark:text-stone-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        All Study Groups ({groups.length})
                      </span>
                    </button>
                    <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          onSelectGroup(group.id);
                          setGroupDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${
                          selectedGroupId === group.id ? 'bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-700 dark:text-blue-300' : 'text-stone-700 dark:text-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">{group.badgeEmoji}</span>
                          <span className="truncate">{group.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 ml-2">
                          {group.materialsCount} sets
                        </span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
                    <button
                      onClick={() => {
                        setGroupDropdownOpen(false);
                        onOpenCreateGroupModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Study Group
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search Input (Desktop/Tablet) */}
          <div className="hidden sm:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search accounting problems, tax, economics, or topics..."
                className="w-full pl-9 pr-4 py-2 bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/80 focus:bg-white dark:focus:bg-stone-800 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 rounded-xl border border-transparent dark:border-stone-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Primary Action & Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 sm:p-2 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-600" />
                )}
              </button>
            )}

            {/* Ask Question Button */}
            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all hover:shadow shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Ask Question</span>
              <span className="sm:hidden text-xs">Ask</span>
            </button>

            {/* If NOT logged in / Guest user: show clean Log In / Register button */}
            {(!user.name || user.id === 'guest' || user.isAnonymous) ? (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 cursor-pointer border border-transparent dark:border-stone-700"
                title="Log In or Register Student ID"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="hidden sm:inline">Log In / Register</span>
                <span className="sm:hidden text-xs whitespace-nowrap">Log In</span>
              </button>
            ) : (
              /* If logged in: show profile with avatar and stats popup */
              <div className="relative shrink-0">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-0.5 sm:p-1 rounded-full hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-colors shrink-0"
                  title={`Logged in as ${user.name}`}
                >
                  <img
                    src={getStudentAvatar(user.name, user.avatar)}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-stone-200 shrink-0 aspect-square"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <div className="font-semibold text-stone-800 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" /> {user.points} XP
                    </div>
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50">
                      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                        <img
                          src={getStudentAvatar(user.name, user.avatar)}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 aspect-square"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-stone-900 truncate">{user.name}</div>
                          <div className="text-xs text-stone-500 truncate">{user.gradeLevel || 'Student Scholar'}</div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 mt-0.5">
                            <Award className="w-3 h-3 shrink-0" />
                            <span>{user.points} XP</span>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 py-3 text-center border-b border-stone-100">
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <div className="text-lg font-bold text-stone-900">{user.solutionsSubmitted}</div>
                          <div className="text-[10px] text-stone-500 font-medium">Solutions Posted</div>
                        </div>
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <div className="text-lg font-bold text-stone-900">{user.materialsShared}</div>
                          <div className="text-[10px] text-stone-500 font-medium">Materials Shared</div>
                        </div>
                      </div>

                      {user.courses && user.courses.length > 0 && (
                        <div className="py-2.5 border-b border-stone-100">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1 flex items-center justify-between">
                            <span>Courses Enrolled</span>
                            <span className="text-stone-400 font-normal">{user.courses.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {user.courses.slice(0, 3).map((c) => (
                              <span key={c} className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                                {c}
                              </span>
                            ))}
                            {user.courses.length > 3 && (
                              <span className="text-[10px] text-stone-400 px-1 py-0.5">
                                +{user.courses.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 space-y-1">
                        <div className="px-2 py-1.5 bg-stone-50 rounded-lg text-[10px] text-stone-500 font-mono truncate flex items-center justify-between">
                          <span>Student ID:</span>
                          <span className="font-bold text-stone-700">{user.authUid ? user.authUid.slice(0, 10) + '...' : user.id}</span>
                        </div>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onOpenEditProfile();
                          }}
                          className="w-full text-center py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          <span>Edit Profile & Avatar</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onTabChange('leaderboard');
                          }}
                          className="w-full text-center py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
                        >
                          View Leaderboard & Badges
                        </button>

                        {onToggleTheme && (
                          <button
                            type="button"
                            onClick={onToggleTheme}
                            className="w-full py-1.5 px-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-500" />}
                              <span>Theme</span>
                            </span>
                            <span className="text-[11px] font-semibold text-stone-500 capitalize">{theme}</span>
                          </button>
                        )}

                        {onSignOut && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              onSignOut();
                            }}
                            className="w-full text-center py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu toggle (Three lines hamburger icon) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
              title={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 dark:text-stone-100" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-stone-800 dark:text-stone-100" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Mobile) - Horizontal scroll on mobile ensures 'Top Rated Solutions' and all tabs are fully visible */}
        <div className="flex items-center gap-1 border-t border-stone-100 dark:border-stone-800 py-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => onTabChange('materials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Study Materials & Problems</span>
          </button>
          <button
            onClick={() => onTabChange('groups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Study Groups ({groups.length})</span>
          </button>
          <button
            onClick={() => onTabChange('top-solutions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'top-solutions'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-200 dark:ring-blue-800'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="Top Rated Solutions (PDF / Image / Video)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-semibold text-stone-900 dark:text-white">Top Rated</span>
            <span className="text-stone-500 dark:text-stone-400 text-[11px] hidden xs:inline">Solutions</span>
          </button>
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Mobile search bar and menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-200 dark:border-stone-800 space-y-3 animate-in slide-in-from-top-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search problems, topics, subjects..."
                className="w-full pl-9 pr-4 py-2 bg-stone-100 dark:bg-stone-800 text-xs rounded-xl border border-transparent dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 text-sm font-medium">
              <button
                onClick={() => {
                  onTabChange('materials');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                  activeTab === 'materials' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                📚 Study Materials & Problems
              </button>
              <button
                onClick={() => {
                  onTabChange('groups');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                  activeTab === 'groups' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                👥 Study Groups ({groups.length})
              </button>
              <button
                onClick={() => {
                  onTabChange('top-solutions');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                  activeTab === 'top-solutions' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                ✨ Top Rated Solutions
              </button>
              <button
                onClick={() => {
                  onTabChange('leaderboard');
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg cursor-pointer ${
                  activeTab === 'leaderboard' ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-stone-700 dark:text-stone-200'
                }`}
              >
                🏆 Solver Leaderboard
              </button>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mb-1">Study Group:</div>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => {
                  onSelectGroup(e.target.value ? e.target.value : null);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs rounded-lg p-2 text-stone-800 dark:text-stone-200 outline-none"
              >
                <option value="">All Study Groups ({groups.length})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Theme Switcher */}
            {onToggleTheme && (
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Theme</span>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
                  <span className="capitalize">{theme} Mode</span>
                </button>
              </div>
            )}

            {/* Mobile Profile bar */}
            {(!user.name || user.id === 'guest' || user.isAnonymous) ? (
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-800/80 p-3 rounded-2xl border border-stone-200/50 dark:border-stone-700/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-300 font-bold shrink-0">
                    <User className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">Guest Visitor</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">Sign in to save solutions & XP</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-400 dark:text-white" />
                  <span>Log In / Register</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-800/80 p-3 rounded-2xl border border-stone-200/50 dark:border-stone-700/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={getStudentAvatar(user.name, user.avatar)}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0 aspect-square"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">{user.name}</div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{user.gradeLevel || 'Student Scholar'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEditProfile();
                    }}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                  {onSignOut && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSignOut();
                      }}
                      className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-stone-700 dark:text-stone-200 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
