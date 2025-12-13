import { useEffect, useState } from 'react';
import { useTransactionsStore } from '../../features/transactions/store/useTransactionsStore';
import { useCategoriesStore } from '../../features/categories/store/useCategoriesStore';
import { useWalletsStore } from '../../features/wallets/store/useWalletsStore';
import { useFiltersStore } from '../../store/useFiltersStore';
import { TransactionList } from '../../features/transactions/components/TransactionList';
import { TransactionForm } from '../../features/transactions/components/TransactionForm';
import { UploadCsv } from '../../features/transactions/components/UploadCsv';
import httpClient from '../../lib/httpClient';

export function TransactionsPage() {
  const transactionsStore = useTransactionsStore();
  const categoriesStore = useCategoriesStore();
  const walletsStore = useWalletsStore();
  const filters = useFiltersStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    categoriesStore.fetchCategories();
    walletsStore.fetchWallets();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters.startDate, filters.endDate, filters.type, filters.categoryId, filters.walletId, filters.search]);

  const loadTransactions = async () => {
    try {
      await transactionsStore.fetchTransactions({
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: filters.type,
        categoryId: filters.categoryId,
        walletId: filters.walletId,
        search: filters.search,
      });
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      if (editingTransaction) {
        await transactionsStore.updateTransaction(editingTransaction.id, payload);
      } else {
        await transactionsStore.addTransaction(payload);
      }
      setShowForm(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert(error.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionsStore.deleteTransaction(id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert(error.message || 'Failed to delete transaction');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.search) params.append('search', filters.search);

      const response = await httpClient.get(`/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export transactions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            {showImport ? 'Hide Import' : 'Import CSV'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {showImport && (
        <UploadCsv
          onImportComplete={() => {
            setShowImport(false);
            loadTransactions();
          }}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => filters.setStartDate(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => filters.setEndDate(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            placeholder="End Date"
          />
          <select
            value={filters.type}
            onChange={(e) => filters.setType(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.categoryId || ''}
            onChange={(e) => filters.setCategoryId(e.target.value || null)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Categories</option>
            {categoriesStore.items.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={filters.walletId || ''}
            onChange={(e) => filters.setWalletId(e.target.value || null)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Wallets</option>
            {walletsStore.items.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm flex-1 min-w-[200px]"
            placeholder="Search notes..."
          />
        </div>

        <TransactionList
          transactions={transactionsStore.items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={transactionsStore.loading}
        />
      </div>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          loading={transactionsStore.loading}
        />
      )}
    </div>
  );
}

