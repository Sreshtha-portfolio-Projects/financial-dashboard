import { create } from 'zustand';
import { budgetsApi } from '../api/budgetsApi';

export const useBudgetsStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchBudgets: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await budgetsApi.getBudgets(filters);
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addBudget: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newBudget = await budgetsApi.createBudget(payload);
      set((state) => ({
        items: [newBudget, ...state.items],
        loading: false,
      }));
      return newBudget;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBudget: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await budgetsApi.updateBudget(id, payload);
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

  deleteBudget: async (id) => {
    set({ loading: true, error: null });
    try {
      await budgetsApi.deleteBudget(id);
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

