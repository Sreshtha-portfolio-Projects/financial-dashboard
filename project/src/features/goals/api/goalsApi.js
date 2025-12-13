import httpClient from '../../../lib/httpClient';

export const goalsApi = {
  getGoals: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.active) params.append('active', filters.active);
    
    const response = await httpClient.get(`/goals?${params.toString()}`);
    return response.data;
  },

  getGoal: async (id) => {
    const response = await httpClient.get(`/goals/${id}`);
    return response.data;
  },

  createGoal: async (payload) => {
    const response = await httpClient.post('/goals', payload);
    return response.data;
  },

  updateGoal: async (id, payload) => {
    const response = await httpClient.put(`/goals/${id}`, payload);
    return response.data;
  },

  deleteGoal: async (id) => {
    await httpClient.delete(`/goals/${id}`);
  },

  addAllocation: async (goalId, payload) => {
    const response = await httpClient.post(`/goals/${goalId}/allocations`, payload);
    return response.data;
  },

  deleteAllocation: async (goalId, allocationId) => {
    await httpClient.delete(`/goals/${goalId}/allocations/${allocationId}`);
  },
};

