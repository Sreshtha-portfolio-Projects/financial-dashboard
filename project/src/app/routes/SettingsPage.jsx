import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { SettingsAccountPage } from './settings/SettingsAccountPage';
import { SettingsProfilePage } from './settings/SettingsProfilePage';
import { SettingsSecurityPage } from './settings/SettingsSecurityPage';
import { SettingsCategoriesPage } from './settings/SettingsCategoriesPage';
import { SettingsCurrenciesPage } from './settings/SettingsCurrenciesPage';

const settingsTabs = [
  { path: '/settings/account', label: 'Account', icon: '👤' },
  { path: '/settings/profile', label: 'Profile', icon: '📝' },
  { path: '/settings/security', label: 'Security', icon: '🔒' },
  { path: '/settings/categories', label: 'Categories', icon: '📁' },
  { path: '/settings/currencies', label: 'Currencies', icon: '💱' },
];

export function SettingsPage() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="flex">
        {/* Settings Sidebar */}
        <aside className="w-64 bg-white rounded-lg shadow p-4 mr-6">
          <nav className="space-y-1">
            {settingsTabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="flex-1">
          <Routes>
            <Route path="account" element={<SettingsAccountPage />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="security" element={<SettingsSecurityPage />} />
            <Route path="categories" element={<SettingsCategoriesPage />} />
            <Route path="currencies" element={<SettingsCurrenciesPage />} />
            <Route path="*" element={<Navigate to="/settings/account" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

