import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const pageApi = {
    getAll: () => api.get('/pages'),
    getBySlug: (slug) => api.get(`/pages/${slug}`),
    create: (data) => api.post('/pages', data),
    update: (id, data) => api.put(`/pages/${id}`, data),
    delete: (id) => api.delete(`/pages/${id}`),
};

export default api;
