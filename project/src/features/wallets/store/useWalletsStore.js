import { create } from 'zustand';
import { walletsApi } from '../api/walletsApi';

export const useWalletsStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchWallets: async () => {
    set({ loading: true, error: null });
    try {
      const data = await walletsApi.getWallets();
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addWallet: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newWallet = await walletsApi.createWallet(payload);
      set((state) => ({
        items: [newWallet, ...state.items],
        loading: false,
      }));
      return newWallet;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateWallet: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await walletsApi.updateWallet(id, payload);
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

  deleteWallet: async (id) => {
    set({ loading: true, error: null });
    try {
      await walletsApi.deleteWallet(id);
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

