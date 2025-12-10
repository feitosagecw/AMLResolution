const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  cached?: boolean;
  cacheAge?: number;
  cachedAt?: string;
  error?: string;
  message?: string;
}

export interface ApiResult<T> {
  data: T;
  cached: boolean;
  cacheAge: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'API error');
  }

  return {
    data: result.data,
    cached: result.cached ?? false,
    cacheAge: result.cacheAge ?? 0,
  };
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) => 
    fetchApi<T>(endpoint, { 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    }),
  // POST que retorna a resposta completa (incluindo success, message, etc)
  postRaw: async <T>(endpoint: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    return result as T;
  },
};
