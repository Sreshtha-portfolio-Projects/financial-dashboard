import { create } from 'zustand';
import { transactionsApi } from '../api/transactionsApi';

export const useTransactionsStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchTransactions: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await transactionsApi.getTransactions(filters);
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addTransaction: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newTransaction = await transactionsApi.createTransaction(payload);
      set((state) => ({
        items: [newTransaction, ...state.items],
        loading: false,
      }));
      return newTransaction;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTransaction: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await transactionsApi.updateTransaction(id, payload);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updated : item)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      await transactionsApi.deleteTransaction(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

