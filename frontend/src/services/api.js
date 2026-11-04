import axios from 'axios';

const api = axios.create({
  baseURL:'https://mining-maintenance-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token and active tenant header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mining_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const selectedCompanyId = localStorage.getItem('mining_selected_company_id');
    if (selectedCompanyId && selectedCompanyId !== 'ALL') {
      config.headers['x-company-id'] = selectedCompanyId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// API Service Modules
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  reseedDatabase: () => api.post('/auth/seed')
};

export const companyAPI = {
  getAll: () => api.get('/companies'),
  getPublic: () => api.get('/companies/public'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: () => api.get('/dashboard/charts'),
  getLiveFeed: () => api.get('/dashboard/live-feed')
};

export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`)
};

export const tyreAPI = {
  getAll: (params) => api.get('/tyres', { params }),
  getById: (id) => api.get(`/tyres/${id}`),
  create: (data) => api.post('/tyres', data),
  update: (id, data) => api.put(`/tyres/${id}`, data),
  mount: (id, data) => api.post(`/tyres/${id}/mount`, data),
  scrap: (id, data) => api.post(`/tyres/${id}/scrap`, data),
  delete: (id) => api.delete(`/tyres/${id}`)
};

export const inspectionAPI = {
  getAll: (params) => api.get('/inspections', { params }),
  getById: (id) => api.get(`/inspections/${id}`),
  create: (data) => api.post('/inspections', data)
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  approve: (id, data) => api.put(`/maintenance/${id}/approve`, data),
  complete: (id, data) => api.put(`/maintenance/${id}/complete`, data),
  delete: (id) => api.delete(`/maintenance/${id}`)
};

export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  create: (data) => api.post('/alerts', data),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  triggerScan: () => api.post('/alerts/scan')
};

export const siteAPI = {
  getAll: () => api.get('/sites'),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`)
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const reportAPI = {
  getAll: () => api.get('/reports'),
  generate: (data) => api.post('/reports/generate', data),
  getAnalytics: () => api.get('/reports/analytics')
};

export const historyAPI = {
  getAll: (params) => api.get('/history', { params })
};

export default api;
