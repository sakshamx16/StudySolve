export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'studysolve_theme_user_choice';

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  
  try {
    // Clear any previous auto-assigned dark mode from legacy key
    if (localStorage.getItem('studysolve_theme')) {
      localStorage.removeItem('studysolve_theme');
    }
    
    // Check if the user has explicitly toggled and saved a preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // Ignore storage errors in private browsing
  }
  
  // Default is strictly light mode
  return 'light';
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

export function saveThemePreference(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme in localStorage', e);
  }
}
