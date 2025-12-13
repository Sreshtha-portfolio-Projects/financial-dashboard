import httpClient from '../../../lib/httpClient';

export const walletsApi = {
  getWallets: async () => {
    const response = await httpClient.get('/wallets');
    return response.data;
  },

  getWallet: async (id) => {
    const response = await httpClient.get(`/wallets/${id}`);
    return response.data;
  },

  createWallet: async (payload) => {
    const response = await httpClient.post('/wallets', payload);
    return response.data;
  },

  updateWallet: async (id, payload) => {
    const response = await httpClient.put(`/wallets/${id}`, payload);
    return response.data;
  },

  deleteWallet: async (id) => {
    await httpClient.delete(`/wallets/${id}`);
  },

  getWalletSummary: async (id, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await httpClient.get(`/wallets/${id}/summary?${params.toString()}`);
    return response.data;
  },

  getWalletTransactions: async (id, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await httpClient.get(`/wallets/${id}/transactions?${params.toString()}`);
    return response.data;
  },
};

