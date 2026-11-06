import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api', timeout: 30000 })
export const getHealth = () => api.get('/health').then(r => r.data)
export const getMetrics = () => api.get('/metrics').then(r => r.data)
export const getModelInfo = () => api.get('/model-info').then(r => r.data)
export const getSample = () => api.get('/sample').then(r => r.data)
export const predict = (features, model) => api.post('/predict', { features, model }).then(r => r.data)
export default api

export const scanUrl = (url) => api.post('/scan-url', { url }).then(r => r.data)
