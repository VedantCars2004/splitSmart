import axios from 'axios';
import { auth } from '../firebase';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the Firebase ID token to all requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const groupApi = {
    getGroups: () => api.get('/groups/'),
    getGroup: (id: string) => api.get(`/groups/${id}/`),
    createGroup: (data: any) => api.post('/groups/', data),
    updateGroup: (id: string, data: any) => api.put(`/groups/${id}/`, data),
    deleteGroup: (id: string) => api.delete(`/groups/${id}/`),
    addMember: (groupId: string, email: string) =>
      api.post(`/groups/${groupId}/add_member/`, { email }),
  };
  

export const instanceApi = {
  getInstances: () => api.get('/instances/'),
  getInstance: (id: string) => api.get(`/instances/${id}/`),
  createInstance: (data: any) => api.post('/instances/', data),
  updateInstance: (id: string, data: any) => api.put(`/instances/${id}/`, data),
  deleteInstance: (id: string) => api.delete(`/instances/${id}/`),
};

export const itemApi = {
  getItems: () => api.get('/items/'),
  getItem: (id: string) => api.get(`/items/${id}/`),
  createItem: (data: any) => api.post('/items/', data),
  updateItem: (id: string, data: any) => api.put(`/items/${id}/`, data),
  deleteItem: (id: string) => api.delete(`/items/${id}/`),
};

export const balanceApi = {
  getBalances: () => api.get('/balances/'),
};

export default api;
