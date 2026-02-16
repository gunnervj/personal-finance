import { getSession, signOut } from "next-auth/react";

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

// Flag to prevent multiple redirects
let isRedirecting = false;

class ApiClient {
  private baseUrls = {
    user: process.env.NEXT_PUBLIC_USER_SERVICE_URL!,
    budget: process.env.NEXT_PUBLIC_BUDGET_SERVICE_URL!,
    transaction: process.env.NEXT_PUBLIC_TRANSACTION_SERVICE_URL!,
  };

  private async getHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    console.log('Session in API client:', session);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
      console.log('Added Authorization header');
    } else {
      console.warn('No access token in session!');
    }

    return headers;
  }

  private getServiceUrl(service: keyof typeof this.baseUrls): string {
    return this.baseUrls[service];
  }

  async request<T>(
    service: keyof typeof this.baseUrls,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getServiceUrl(service)}${endpoint}`;
    const headers = await this.getHeaders();

    console.log('API Request:', { url, method: options.method || 'GET', headers });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - Token expired
      if (response.status === 401 && !isRedirecting) {
        isRedirecting = true;
        console.warn('Token expired, redirecting to login...');

        // Sign out and redirect to login
        await signOut({ callbackUrl: '/login' });

        // Reset flag after a delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);

        // Throw error to prevent further processing
        throw {
          message: 'Your session has expired. Please login again.',
          status: 401,
        } as ApiError;
      }

      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.details = errorData;
        error.message = errorData.message || error.message;
      } catch {
        // Response is not JSON, use statusText
      }

      console.error('API Error:', error);
      throw error;
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(service: keyof typeof this.baseUrls, endpoint: string): Promise<T> {
    return this.request<T>(service, endpoint, { method: "GET" });
  }

  async post<T>(
    service: keyof typeof this.baseUrls,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    return this.request<T>(service, endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    service: keyof typeof this.baseUrls,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    return this.request<T>(service, endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(service: keyof typeof this.baseUrls, endpoint: string): Promise<T> {
    return this.request<T>(service, endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
