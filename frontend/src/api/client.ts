import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth'

export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  invalidParams?: Record<string, string>
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor: attach In-Memory Bearer Token and MDC Correlation ID
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Generate RFC UUID correlation ID for distributed trace observability
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'req-' + Math.random().toString(36).substring(2, 9)

  config.headers.set('X-Request-Id', requestId)

  try {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.set('Authorization', `Bearer ${authStore.token}`)
    }
  } catch {
    // If Pinia store is not yet initialized (e.g. in isolated unit test)
  }

  return config
})

// Response interceptor: extract RFC 7807 ProblemDetail details
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ProblemDetail>) => {
    if (error.response?.data) {
      const problem = error.response.data
      console.warn(`[API ${error.response.status}] ${problem.title || 'Error'}: ${problem.detail || error.message}`)
    }
    return Promise.reject(error)
  }
)
