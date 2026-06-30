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

export const saleRequestsApi = {
  getAll:  (params={}) => api.get('/api/sale-requests', { params }),
  create:  data        => api.post('/api/sale-requests', data),
  approve: (id, note)  => api.patch(`/api/sale-requests/${id}/approve`, { review_note: note }),
  reject:  (id, note)  => api.patch(`/api/sale-requests/${id}/reject`, { review_note: note }),
};

export const usersApi = {
  getAll:        ()          => api.get('/api/users'),
  create:        data        => api.post('/api/users', data),
  update:        (id, data)  => api.put(`/api/users/${id}`, data),
  resetPassword: (id, pwd)   => api.patch(`/api/users/${id}/password`, { password: pwd }),
  delete:        id          => api.delete(`/api/users/${id}`),
};
