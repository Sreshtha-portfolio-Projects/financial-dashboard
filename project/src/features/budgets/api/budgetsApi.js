import httpClient from '../../../lib/httpClient';

export const budgetsApi = {
  getBudgets: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.active) params.append('active', filters.active);
    
    const response = await httpClient.get(`/budgets?${params.toString()}`);
    return response.data;
  },

  getBudget: async (id) => {
    const response = await httpClient.get(`/budgets/${id}`);
    return response.data;
  },

  createBudget: async (payload) => {
    const response = await httpClient.post('/budgets', payload);
    return response.data;
  },

  updateBudget: async (id, payload) => {
    const response = await httpClient.put(`/budgets/${id}`, payload);
    return response.data;
  },

  deleteBudget: async (id) => {
    await httpClient.delete(`/budgets/${id}`);
  },
};

