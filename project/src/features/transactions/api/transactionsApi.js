import httpClient from '../../../lib/httpClient';

export const transactionsApi = {
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.walletId) params.append('walletId', filters.walletId);
    if (filters.search) params.append('search', filters.search);

    const response = await httpClient.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  createTransaction: async (payload) => {
    const response = await httpClient.post('/transactions', payload);
    return response.data;
  },

  updateTransaction: async (id, payload) => {
    const response = await httpClient.put(`/transactions/${id}`, payload);
    return response.data;
  },

  deleteTransaction: async (id) => {
    await httpClient.delete(`/transactions/${id}`);
  },
};

