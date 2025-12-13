import httpClient from '../../../lib/httpClient';

export const analyticsApi = {
  getSpendingByCategory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);
    
    const response = await httpClient.get(`/analytics/spending-by-category?${params.toString()}`);
    return response.data;
  },

  getIncomeVsExpense: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.groupBy) params.append('groupBy', filters.groupBy);
    
    const response = await httpClient.get(`/analytics/income-vs-expense?${params.toString()}`);
    return response.data;
  },

  getTopMerchants: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await httpClient.get(`/analytics/top-merchants?${params.toString()}`);
    return response.data;
  },

  getWalletExpenseSplit: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await httpClient.get(`/analytics/wallet-expense-split?${params.toString()}`);
    return response.data;
  },
};

