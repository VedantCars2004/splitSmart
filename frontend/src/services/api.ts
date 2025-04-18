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
    
    // Debug log the auth header
    console.log('Setting auth header with token for', user.email);
  } else {
    console.log('No current user for auth header');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor for debugging
api.interceptors.response.use((response) => {
  // Any status code that lie within the range of 2xx
  if (response.config.url?.includes('/balances/')) {
    console.log('Balance API response:', response.data);
  }
  return response;
}, (error) => {
  // Any status codes outside the range of 2xx
  console.error('API error:', error.response?.data || error.message);
  return Promise.reject(error);
});

export const groupApi = {
  getGroups: () => api.get('/groups/'),
  getGroup: (id: string) => api.get(`/groups/${id}/`),
  createGroup: (data: any) => api.post('/groups/', data),
  updateGroup: (id: string, data: any) => api.put(`/groups/${id}/`, data),
  deleteGroup: (id: string) => api.delete(`/groups/${id}/`),
  leaveGroup: (groupId: string) => api.post(`/groups/${groupId}/leave_group/`),
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
  createItem: (data: any) => {
    console.log('Creating item with data:', data);
    return api.post('/items/', data);
  },
  updateItem: (id: string, data: any) => api.put(`/items/${id}/`, data),
  deleteItem: (id: string) => api.delete(`/items/${id}/`),
};

export const balanceApi = {
  getBalances: () => api.get('/balances/'),
};

export default api;