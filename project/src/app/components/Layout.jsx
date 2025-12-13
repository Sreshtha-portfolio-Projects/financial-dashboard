import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAuthStore();
  const logoutInProgress = useRef(false);

  const handleLogout = async (e) => {
    // Prevent double clicks and duplicate calls
    if (logoutInProgress.current || isLoggingOut) {
      e?.preventDefault();
      return;
    }

    try {
      logoutInProgress.current = true;
      await logout();
      navigate('/login');
    } finally {
      // Reset after a short delay to allow navigation
      setTimeout(() => {
        logoutInProgress.current = false;
      }, 1000);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/transactions', label: 'Transactions', icon: '💰' },
    { path: '/wallets', label: 'Wallets', icon: '💳' },
    { path: '/budgets', label: 'Budgets', icon: '📊' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/categories', label: 'Categories', icon: '📁' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/settings/account', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg min-h-screen transition-colors">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Finance Dashboard</h1>
          </div>
          <nav className="mt-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-r-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
            <div className="px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

