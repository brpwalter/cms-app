import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fügt das Token bei jedem Request hinzu, falls vorhanden
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.url?.startsWith('/public/')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export const pageApi = {
    getAll: () => api.get('/pages'),
    getBySlug: (slug) => api.get(`/pages/${slug}`),
    preview: (slug) => api.get(`/pages/preview/${encodeURIComponent(slug)}`),
    create: (data) => api.post('/pages', data),
    update: (id, data) => api.put(`/pages/${id}`, data),
    delete: (id) => api.delete(`/pages/${id}`),
    approve: (id) => api.post(`/pages/${id}/approve`),
};

export const userApi = {
    getAll: () => api.get('/admin/users'),
    create: (data) => api.post('/admin/users', data),
    update: (id, data) => api.put(`/admin/users/${id}`, data),
    delete: (id) => api.delete(`/admin/users/${id}`),
};

export default api;
