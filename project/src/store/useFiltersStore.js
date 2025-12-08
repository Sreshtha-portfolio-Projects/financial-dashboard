import { create } from 'zustand';
import { getDateRange } from '../lib/formatters';

const { startDate, endDate } = getDateRange('month');

export const useFiltersStore = create((set) => ({
  startDate,
  endDate,
  type: 'all', // 'all' | 'income' | 'expense'
  categoryId: null,
  search: '',

  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setType: (type) => set({ type }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setSearch: (search) => set({ search }),

  resetFilters: () => {
    const { startDate: sd, endDate: ed } = getDateRange('month');
    set({
      startDate: sd,
      endDate: ed,
      type: 'all',
      categoryId: null,
      search: '',
    });
  },
}));

