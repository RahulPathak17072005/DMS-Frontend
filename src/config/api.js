// API configuration for different environments
const getApiUrl = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // In development, use proxy
    return ""
  }

  // In production, use environment variable or fallback
  return import.meta.env.VITE_API_URL || window.location.origin.replace(":5173", ":5000")
}

export const API_BASE_URL = getApiUrl()

// Create axios instance with proper base URL
import axios from "axios"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default apiClient
