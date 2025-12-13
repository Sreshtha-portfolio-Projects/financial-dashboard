import { useEffect, useState } from 'react';
import { useWalletsStore } from '../../features/wallets/store/useWalletsStore';
import { WalletCard } from '../../features/wallets/components/WalletCard';
import { WalletForm } from '../../features/wallets/components/WalletForm';
import { walletsApi } from '../../features/wallets/api/walletsApi';
import { TransactionList } from '../../features/transactions/components/TransactionList';
import { TrendChart } from '../../features/dashboard/components/TrendChart';
import { formatCurrency } from '../../lib/formatters';

export function WalletsPage() {
  const walletsStore = useWalletsStore();
  const [showForm, setShowForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletSummary, setWalletSummary] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    walletsStore.fetchWallets();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      loadWalletDetails(selectedWallet.id);
    }
  }, [selectedWallet]);

  const loadWalletDetails = async (walletId) => {
    setLoadingDetails(true);
    try {
      const [summary, transactions] = await Promise.all([
        walletsApi.getWalletSummary(walletId),
        walletsApi.getWalletTransactions(walletId, { limit: 50 }),
      ]);
      setWalletSummary(summary);
      setWalletTransactions(transactions);
    } catch (error) {
      console.error('Failed to load wallet details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAdd = () => {
    setEditingWallet(null);
    setShowForm(true);
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingWallet) {
        await walletsStore.updateWallet(editingWallet.id, payload);
      } else {
        await walletsStore.addWallet(payload);
      }
      setShowForm(false);
      setEditingWallet(null);
    } catch (error) {
      console.error('Failed to save wallet:', error);
      alert(error.message || 'Failed to save wallet');
    }
  };

  const handleDelete = async (id) => {
    try {
      await walletsStore.deleteWallet(id);
      if (selectedWallet?.id === id) {
        setSelectedWallet(null);
        setWalletSummary(null);
        setWalletTransactions([]);
      }
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      alert(error.message || 'Failed to delete wallet');
    }
  };

  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
  };

  const totalBalance = walletsStore.items.reduce(
    (sum, wallet) => sum + parseFloat(wallet.balance || 0),
    0
  );

  if (selectedWallet) {
    // Wallet detail view
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedWallet(null)}
              className="text-indigo-600 hover:text-indigo-800 mb-2"
            >
              ← Back to Wallets
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedWallet.name}</h1>
            <p className="text-gray-600 capitalize">{selectedWallet.type}</p>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : walletSummary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(walletSummary.summary.total_income, selectedWallet.currency)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Expense</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(walletSummary.summary.total_expense, selectedWallet.currency)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Net Change</p>
                <p className={`text-2xl font-bold ${
                  walletSummary.summary.net_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(walletSummary.summary.net_change, selectedWallet.currency)}
                </p>
              </div>
            </div>

            {walletSummary.trend && walletSummary.trend.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
                <TrendChart data={walletSummary.trend} loading={false} />
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <TransactionList
                transactions={walletTransactions}
                onEdit={() => {}}
                onDelete={() => {}}
                loading={loadingDetails}
              />
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // Wallets list view
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
          <p className="text-gray-600 mt-1">
            Total Balance: <span className="font-semibold">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add Wallet
        </button>
      </div>

      {walletsStore.loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : walletsStore.items.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No wallets yet. Create your first wallet to get started.</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {walletsStore.items.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={() => handleWalletClick(wallet)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <WalletForm
          wallet={editingWallet}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingWallet(null);
          }}
          loading={walletsStore.loading}
        />
      )}
    </div>
  );
}

