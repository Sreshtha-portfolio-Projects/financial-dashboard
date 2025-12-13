import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/AppRouter';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import './styles/index.css';

// Initialize auth session on app load
useAuthStore.getState().initSession();

// Initialize theme (already handled in useThemeStore, but ensure it's applied)
const theme = useThemeStore.getState().theme;
const root = document.documentElement;
// Force remove first, then add if needed
root.classList.remove('dark');
if (theme === 'dark') {
  root.classList.add('dark');
}
console.log('Main.jsx - Initial theme:', theme, 'Has dark class:', root.classList.contains('dark'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

