import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL ?? '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Handle unauthorized - clear auth and redirect
          this.clearAuthToken()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private clearAuthToken(): void {
    localStorage.removeItem('auth_token')
  }

  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token)
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient

