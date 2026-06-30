import api from './client';

export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  me:    ()                => api.get('/api/auth/me'),
};

export const productsApi = {
  getAll:   (params = {}) => api.get('/api/products', { params }),
  getOne:   id            => api.get(`/api/products/${id}`),
  getStats: ()            => api.get('/api/products/stats'),
  create:   data          => api.post('/api/products', data),
  update:   (id, data)    => api.put(`/api/products/${id}`, data),
  delete:   id            => api.delete(`/api/products/${id}`),
};

export const subtypesApi = {
  getAll: productId            => api.get(`/api/products/${productId}/subtypes`),
  create: (productId, data)    => api.post(`/api/products/${productId}/subtypes`, data),
  update: (productId, id, data)=> api.put(`/api/products/${productId}/subtypes/${id}`, data),
  delete: (productId, id)      => api.delete(`/api/products/${productId}/subtypes/${id}`),
};

export const categoriesApi = {
  getAll:  ()         => api.get('/api/categories'),
  create:  data       => api.post('/api/categories', data),
  update:  (id, data) => api.put(`/api/categories/${id}`, data),
  delete:  id         => api.delete(`/api/categories/${id}`),
};

export const stockApi = {
  getSummary: ()       => api.get('/api/stock/summary'),
  getHistory: params   => api.get('/api/stock/history', { params }),
  adjust:     data     => api.post('/api/stock/adjust', data),
};
