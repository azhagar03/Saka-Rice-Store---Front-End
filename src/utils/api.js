import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Rice APIs
export const getRiceItems = () => API.get('/rice');
export const getRiceById = (id) => API.get(`/rice/${id}`);
export const createRice = (data) => API.post('/rice', data);
export const updateRice = (id, data) => API.put(`/rice/${id}`, data);
export const updateStock = (id, addStock) => API.patch(`/rice/${id}/stock`, { addStock });
export const deleteRice = (id) => API.delete(`/rice/${id}`);

// Sales APIs

export const getSales    = (params) => API.get('/sales', { params });
export const getSaleById = (id)     => API.get(`/sales/${id}`);
export const createSale  = (data)   => API.post('/sales', data);
export const updateSale  = (id, data) => API.put(`/sales/${id}`, data);   // ADD
export const deleteSale  = (id)     => API.delete(`/sales/${id}`);        // ADD

// Customer APIs
export const getCustomers        = (params) => API.get('/customers', { params });
export const getCustomersPending = ()        => API.get('/customers/pending/summary');
export const getCustomerById     = (id)      => API.get(`/customers/${id}`);
export const createCustomer      = (data)    => API.post('/customers', data);
export const updateCustomer      = (id, data)=> API.put(`/customers/${id}`, data);
export const deleteCustomer      = (id)      => API.delete(`/customers/${id}`);

// Dashboard APIs
export const getDashboardStats = (filter) => API.get('/dashboard/stats', { params: { filter } });
