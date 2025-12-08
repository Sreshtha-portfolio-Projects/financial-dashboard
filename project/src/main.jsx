import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './app/AppRouter';
import { useAuthStore } from './features/auth/store/useAuthStore';
import './styles/index.css';

// Initialize auth session on app load
useAuthStore.getState().initSession();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

