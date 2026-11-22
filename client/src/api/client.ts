import type {
  ApiError,
  CategoryProductsResponse,
  EnquiryPayload,
  EnquiryResponse,
  Product,
} from '../types/domain';

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api';
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

function isApiErrorPayload(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const { error } = value as { error: unknown };

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiRequestError(
      response.status,
      'INVALID_RESPONSE',
      'The catalogue service returned an invalid response.',
    );
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the catalogue service. Please try again.',
    );
  }

  const body = await readJson(response);

  if (!response.ok) {
    if (isApiErrorPayload(body)) {
      throw new ApiRequestError(response.status, body.error.code, body.error.message);
    }

    throw new ApiRequestError(
      response.status,
      'REQUEST_FAILED',
      `The catalogue service could not complete this request (${response.status}).`,
    );
  }

  return body as T;
}

export const catalogueApi = {
  getFeaturedProducts(): Promise<Product[]> {
    return request<Product[]>('/products/featured');
  },

  getCategories(): Promise<string[]> {
    return request<string[]>('/categories');
  },

  getCategoryPage(category: string): Promise<CategoryProductsResponse> {
    return request<CategoryProductsResponse>(
      `/categories/${encodeURIComponent(category)}`,
    );
  },

  searchProducts(query: string): Promise<Product[]> {
    return request<Product[]>(`/products?search=${encodeURIComponent(query)}`);
  },

  getProduct(id: number): Promise<Product> {
    return request<Product>(`/products/${id}`);
  },

  sendEnquiry(payload: EnquiryPayload): Promise<EnquiryResponse> {
    return request<EnquiryResponse>('/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
