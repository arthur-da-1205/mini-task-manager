import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

type ApiSuccessResponse<T> = {
  data: T
}

type ApiErrorResponse = {
  error?: {
    message?: string
  }
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function requestJson<T>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await httpClient.request<ApiSuccessResponse<T>>({
      url: path,
      ...config,
    })

    return response.data.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const responseData = error.response?.data as ApiErrorResponse | undefined
      throw new Error(responseData?.error?.message ?? error.message, {
        cause: error,
      })
    }

    throw error
  }
}
