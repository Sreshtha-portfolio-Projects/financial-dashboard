import { create } from 'zustand';
import { goalsApi } from '../api/goalsApi';

export const useGoalsStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchGoals: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await goalsApi.getGoals(filters);
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addGoal: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newGoal = await goalsApi.createGoal(payload);
      set((state) => ({
        items: [newGoal, ...state.items],
        loading: false,
      }));
      return newGoal;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateGoal: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await goalsApi.updateGoal(id, payload);
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

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await goalsApi.deleteGoal(id);
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

