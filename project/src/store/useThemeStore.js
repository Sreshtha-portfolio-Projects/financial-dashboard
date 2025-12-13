import { create } from 'zustand';

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to light mode (don't check system preference to avoid confusion)
    return 'light';
  }
  return 'light';
};

// Apply theme class to document
const applyTheme = (theme) => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    // Force remove first, then add if needed (ensures clean state)
    root.classList.remove('dark');
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
    console.log('Theme applied:', theme, 'Has dark class:', root.classList.contains('dark'), 'HTML classes:', root.className);
  }
};

// Initialize theme on load
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  
  toggleTheme: () => {
    const currentState = useThemeStore.getState();
    const newTheme = currentState.theme === 'light' ? 'dark' : 'light';
    console.log('Toggling theme from', currentState.theme, 'to', newTheme);
    applyTheme(newTheme);
    set({ theme: newTheme });
  },
}));
