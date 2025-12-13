import { useState, useEffect } from 'react';
import httpClient from '../../../lib/httpClient';
import { formatDate } from '../../../lib/formatters';

export function SettingsAccountPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await httpClient.get('/settings/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
      return;
    }

    alert('Account deletion must be done through Supabase dashboard for security reasons.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Account Information</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-gray-900">{profile?.email}</p>
          <p className="mt-1 text-sm text-gray-500">
            To change your email, please contact support or use Supabase dashboard
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Member Since</label>
          <p className="mt-1 text-gray-900">
            {profile ? formatDate(profile.created_at) : 'N/A'}
          </p>
        </div>
        <div className="pt-4 border-t">
          <h3 className="text-md font-semibold text-red-600 mb-2">Danger Zone</h3>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

