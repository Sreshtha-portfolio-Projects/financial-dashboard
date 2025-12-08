import httpClient from '../../../lib/httpClient';

export const categoriesApi = {
  getCategories: async () => {
    const response = await httpClient.get('/categories');
    return response.data;
  },

  createCategory: async (payload) => {
    const response = await httpClient.post('/categories', payload);
    return response.data;
  },

  updateCategory: async (id, payload) => {
    const response = await httpClient.put(`/categories/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id) => {
    await httpClient.delete(`/categories/${id}`);
  },
};

