import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kadaivoice_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('kadaivoice_token');
        localStorage.removeItem('kadaivoice_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  setup: (data) => api.post('/auth/setup', data),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getSalesChart: () => api.get('/dashboard/sales-chart'),
};

export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  bulkAdd: (products) => api.post('/products/bulk', { products }),
};

export const inventoryAPI = {
  getOverview: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  adjustStock: (data) => api.post('/inventory/adjust', data),
  recordPurchase: (data) => api.post('/inventory/purchase', data),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  generateSupplierIndent: (data) => api.post('/inventory/supplier-indent', data),
};

export const salesAPI = {
  getSales: (params) => api.get('/sales', { params }),
  createSale: (data) => api.post('/sales', data),
  getSaleById: (id) => api.get(`/sales/${id}`),
  reverseSale: (id, data) => api.post(`/sales/${id}/reverse`, data),
};

export const customersAPI = {
  getCustomers: (params) => api.get('/customers', { params }),
  createCustomer: (data) => api.post('/customers', data),
  getCustomerDetails: (id) => api.get(`/customers/${id}`),
};

export const creditAPI = {
  getOverview: () => api.get('/credits'),
  recordRepayment: (data) => api.post('/credits/repayments', data),
  generateWhatsAppReminder: (customerId) => api.post(`/credits/whatsapp-reminder/${customerId}`),
};

export const voiceAPI = {
  getAIStatus: () => api.get('/voice/status'),
  transcribeAudio: (formData) => api.post('/voice/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  interpretCommand: (data) => api.post('/voice/interpret', data),
  confirmTransaction: (data) => api.post('/voice/confirm', data),
  synthesizeSpeech: (data) => api.post('/voice/speak', data),
};

export const reportsAPI = {
  getDailyReport: (date) => api.get('/reports/daily', { params: { date } }),
  getWeeklyReport: () => api.get('/reports/weekly'),
  getTallyXML: (params) => api.get('/reports/tally-xml', { params, responseType: 'blob' }),
  getGSTJSON: (params) => api.get('/reports/gst-export', { params }),
};

export const aiAPI = {
  getInsights: () => api.get('/ai/insights'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateShop: (data) => api.put('/settings/shop', data),
  resetDemo: () => api.post('/settings/reset-demo'),
};

export default api;
