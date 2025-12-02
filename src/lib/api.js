import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
export const api = axios.create({ baseURL: API_BASE, timeout: 20000 });

export const fetchMenus = () => api.get("/menus");
export const fetchMenu = (id) => api.get(`/menus/${id}`);
export const createOrder = (payload) => api.post("/orders", payload);
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createPayment = (orderId) => api.post(`/payments/${orderId}/create`);
export const payOrder = (id) => api.patch(`/orders/${id}/pay`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);
