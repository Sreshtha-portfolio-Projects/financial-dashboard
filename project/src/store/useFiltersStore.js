import { create } from 'zustand';
import { getDateRange } from '../lib/formatters';

// CHANGE: Don't set default date filters - show all transactions by default
// const { startDate, endDate } = getDateRange('month');

export const useFiltersStore = create((set) => ({
  startDate: null, // CHANGE: null instead of default month range
  endDate: null,   // CHANGE: null instead of default month range
  type: 'all', // 'all' | 'income' | 'expense'
  categoryId: null,
  search: '',

  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setType: (type) => set({ type }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setSearch: (search) => set({ search }),

  resetFilters: () => {
    // CHANGE: Reset to null (show all) instead of month range
    set({
      startDate: null,
      endDate: null,
      type: 'all',
      categoryId: null,
      search: '',
    });
  },
}));

