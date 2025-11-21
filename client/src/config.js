// API Configuration
const API_HOST = import.meta.env.VITE_API_HOST_HOME || import.meta.env.VITE_API_HOST_HOTSPOT || window.location.hostname || '192.168.100.69';
const API_PORT = import.meta.env.VITE_API_PORT || '4000';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/api`;
export const SOCKET_URL = `http://${API_HOST}:${API_PORT}`;

console.log('API Configuration:', { API_BASE_URL, SOCKET_URL });
