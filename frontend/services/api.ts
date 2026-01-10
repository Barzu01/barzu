import axios from 'axios';
import { CarListing, SearchFilters, User } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
const API_BASE = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User APIs
export const userAPI = {
  createOrGet: async (phone: string) => {
    const response = await api.post(`/users?phone=${encodeURIComponent(phone)}`);
    return response.data;
  },
  getUser: async (phone: string) => {
    const response = await api.get(`/users/${encodeURIComponent(phone)}`);
    return response.data;
  },
  updateUser: async (phone: string, name?: string) => {
    const response = await api.put(`/users/${encodeURIComponent(phone)}?name=${encodeURIComponent(name || '')}`);
    return response.data;
  },
};

// Car APIs
export const carAPI = {
  create: async (car: CarListing) => {
    const response = await api.post('/cars', car);
    return response.data;
  },
  getAll: async (status?: string, limit = 50, skip = 0) => {
    const response = await api.get(`/cars?status=${status || 'approved'}&limit=${limit}&skip=${skip}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },
  update: async (id: string, car: CarListing) => {
    const response = await api.put(`/cars/${id}`, car);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/cars/${id}`);
    return response.data;
  },
  getUserCars: async (userId: string, limit = 50, skip = 0) => {
    const response = await api.get(`/cars/user/${encodeURIComponent(userId)}?limit=${limit}&skip=${skip}`);
    return response.data;
  },
  search: async (filters: SearchFilters, limit = 50, skip = 0) => {
    const response = await api.post(`/cars/search?limit=${limit}&skip=${skip}`, filters);
    return response.data;
  },
};

// Favorites APIs
export const favoritesAPI = {
  add: async (phone: string, carId: string) => {
    const response = await api.post(`/favorites/${phone}/${carId}`);
    return response.data;
  },
  remove: async (phone: string, carId: string) => {
    const response = await api.delete(`/favorites/${phone}/${carId}`);
    return response.data;
  },
  getAll: async (phone: string) => {
    const response = await api.get(`/favorites/${phone}`);
    return response.data;
  },
};

// My Listings API
export const myListingsAPI = {
  getAll: async (phone: string) => {
    const response = await api.get(`/my-listings/${phone}`);
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  getPendingCars: async () => {
    const response = await api.get('/admin/cars/pending');
    return response.data;
  },
  approveCar: async (carId: string) => {
    const response = await api.put(`/admin/cars/${carId}/approve`);
    return response.data;
  },
  rejectCar: async (carId: string) => {
    const response = await api.put(`/admin/cars/${carId}/reject`);
    return response.data;
  },
  blockUser: async (phone: string) => {
    const response = await api.put(`/admin/users/${phone}/block`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

// Notification APIs
export const notificationAPI = {
  getAll: async (userId: string) => {
    const response = await api.get(`/notifications/${userId}`);
    return response.data;
  },
  getUnreadCount: async (userId: string) => {
    const response = await api.get(`/notifications/${userId}/unread-count`);
    return response.data;
  },
  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllAsRead: async (userId: string) => {
    const response = await api.put(`/notifications/${userId}/read-all`);
    return response.data;
  },
};

// Car Brands & Models APIs
export const brandsAPI = {
  sync: async () => {
    const response = await api.post('/brands/sync');
    return response.data;
  },
  getAll: async (search?: string, limit = 100) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());
    const response = await api.get(`/brands?${params.toString()}`);
    return response.data;
  },
  getModels: async (makeId: number) => {
    const response = await api.get(`/brands/${makeId}/models`);
    return response.data;
  },
  searchModels: async (makeId: number, search: string, limit = 50) => {
    const params = new URLSearchParams();
    params.append('make_id', makeId.toString());
    params.append('search', search);
    params.append('limit', limit.toString());
    const response = await api.get(`/models/search?${params.toString()}`);
    return response.data;
  },
};

// Chat APIs
export const chatAPI = {
  getChats: async (userId: string) => {
    const response = await api.get(`/chats/${encodeURIComponent(userId)}`);
    return response.data;
  },
  createOrGetChat: async (senderId: string, receiverId: string, carId?: string, carTitle?: string) => {
    const params = new URLSearchParams();
    params.append('senderId', senderId);
    params.append('receiverId', receiverId);
    if (carId) params.append('carId', carId);
    if (carTitle) params.append('carTitle', carTitle);
    const response = await api.post(`/chats?${params.toString()}`);
    return response.data;
  },
  getMessages: async (chatId: string, limit = 50, skip = 0) => {
    const response = await api.get(`/chats/${chatId}/messages?limit=${limit}&skip=${skip}`);
    return response.data;
  },
  sendMessage: async (chatId: string, senderId: string, receiverId: string, message: string, carId?: string, carTitle?: string) => {
    const params = new URLSearchParams();
    params.append('senderId', senderId);
    params.append('receiverId', receiverId);
    params.append('message', message);
    if (carId) params.append('carId', carId);
    if (carTitle) params.append('carTitle', carTitle);
    const response = await api.post(`/chats/${chatId}/messages?${params.toString()}`);
    return response.data;
  },
  markAsRead: async (chatId: string, userId: string) => {
    const response = await api.put(`/chats/${chatId}/read?user_id=${encodeURIComponent(userId)}`);
    return response.data;
  },
  getUnreadCount: async (userId: string) => {
    const response = await api.get(`/chats/unread-count/${encodeURIComponent(userId)}`);
    return response.data;
  },
};

// Reports API
export const reportAPI = {
  create: async (carId: string, reporterId: string, reason: string, description?: string) => {
    const params = new URLSearchParams();
    params.append('carId', carId);
    params.append('reporterId', reporterId);
    params.append('reason', reason);
    if (description) params.append('description', description);
    const response = await api.post(`/reports?${params.toString()}`);
    return response.data;
  },
};

// Recently Viewed API
export const recentlyViewedAPI = {
  add: async (userId: string, carId: string) => {
    const params = new URLSearchParams();
    params.append('userId', userId);
    params.append('carId', carId);
    const response = await api.post(`/recently-viewed?${params.toString()}`);
    return response.data;
  },
  getAll: async (userId: string, limit = 20) => {
    const response = await api.get(`/recently-viewed/${encodeURIComponent(userId)}?limit=${limit}`);
    return response.data;
  },
};

// Advanced Search API
export const advancedSearchAPI = {
  search: async (filters: any, limit = 50, skip = 0) => {
    const response = await api.post(`/cars/search/advanced?limit=${limit}&skip=${skip}`, filters);
    return response.data;
  },
};

// Promotion API
export const promotionAPI = {
  promote: async (carId: string, days: number = 7) => {
    const response = await api.post(`/cars/${carId}/promote?days=${days}`);
    return response.data;
  },
  getPromoted: async (limit = 10) => {
    const response = await api.get(`/cars/promoted?limit=${limit}`);
    return response.data;
  },
};

// View tracking API
export const viewAPI = {
  trackView: async (carId: string, userId?: string) => {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await api.post(`/cars/${carId}/view${params}`);
    return response.data;
  },
  getPriceHistory: async (carId: string) => {
    const response = await api.get(`/cars/${carId}/price-history`);
    return response.data;
  },
};

export default api;