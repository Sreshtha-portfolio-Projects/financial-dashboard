import { create } from 'zustand';
import { categoriesApi } from '../api/categoriesApi';

export const useCategoriesStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const data = await categoriesApi.getCategories();
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addCategory: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newCategory = await categoriesApi.createCategory(payload);
      set((state) => ({
        items: [...state.items, newCategory].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      }));
      return newCategory;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCategory: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await categoriesApi.updateCategory(id, payload);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      await categoriesApi.deleteCategory(id);
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

