import httpClient from '../../../lib/httpClient';

export const dashboardApi = {
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await httpClient.get(`/dashboard/summary?${params.toString()}`);
    return response.data;
  },

  getTrend: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);

    const response = await httpClient.get(`/dashboard/trend?${params.toString()}`);
    return response.data;
  },

  getCategoryBreakdown: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await httpClient.get(`/dashboard/category-breakdown?${params.toString()}`);
    return response.data;
  },
};

