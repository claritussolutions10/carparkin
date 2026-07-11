import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('carparkin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('carparkin_token')
      localStorage.removeItem('carparkin_user')
      window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`
    }
    return Promise.reject(error)
  }
)

export default client
