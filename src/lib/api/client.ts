import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { WORDPRESS_API_BASE_URL, API_TIMEOUT, MAX_RETRIES } from './config'

function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080'
  return `${baseUrl}/index.php?rest_route=${path}`
}

const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: WORDPRESS_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: API_TIMEOUT,
  })

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config,
    (error: AxiosError) => Promise.reject(error)
  )

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number }
      
      if (!config._retry && (!error.response || error.response.status >= 500)) {
        config._retry = true
        config._retryCount = (config._retryCount || 0) + 1
        
        if (config._retryCount <= MAX_RETRIES) {
          const delay = Math.pow(2, config._retryCount) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return api(config)
        }
      }
      
      return Promise.reject(error)
    }
  )

  return api
}

export const apiClient = createApiClient()
export { getApiUrl }
