import { useState, useEffect } from 'react';
import httpClient from '../../../lib/httpClient';

export function SettingsCurrenciesPage() {
  const [currencies, setCurrencies] = useState(null);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const response = await httpClient.get('/settings/currencies');
      setCurrencies(response.data);
      setDefaultCurrency(response.data.default_currency);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await httpClient.put('/settings/currencies', {
        default_currency: defaultCurrency,
      });
      alert('Currency preference saved');
    } catch (error) {
      alert('Failed to save currency preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const commonCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Currency Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Default Currency</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            {commonCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
        {currencies?.available_currencies && currencies.available_currencies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Currencies in Use</label>
            <p className="mt-1 text-sm text-gray-600">
              {currencies.available_currencies.join(', ')}
            </p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

