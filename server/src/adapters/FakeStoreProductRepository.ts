import { z } from 'zod';
import { UpstreamServiceError } from '../errors/AppError.js';
import type { Product } from '../types/domain.js';
import type { ProductRepository } from './ProductRepository.js';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface FakeStoreProductRepositoryOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

const fakeStoreProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number(),
    count: z.number(),
  }),
});

type FakeStoreProduct = z.infer<typeof fakeStoreProductSchema>;

const fakeStoreProductsSchema = z.array(fakeStoreProductSchema);

function toDomainProduct(raw: FakeStoreProduct): Product {
  return {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    description: raw.description,
    category: raw.category,
    image: raw.image,
    rating: {
      rate: raw.rating.rate,
      count: raw.rating.count,
    },
  };
}

export class FakeStoreProductRepository implements ProductRepository {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: FakeStoreProductRepositoryOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  async getAll(): Promise<Product[]> {
    const payload = await this.request('/products', fakeStoreProductsSchema);

    return payload.map(toDomainProduct);
  }

  async getById(id: number): Promise<Product | null> {
    const products = await this.getAll();
    return products.find((product) => product.id === id) ?? null;
  }

  async getCategories(): Promise<string[]> {
    const products = await this.getAll();

    return [...new Set(products.map((product) => product.category))];
  }

  private async request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    let response: Response;

    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new UpstreamServiceError('Unable to reach the product data source');
    }

    if (!response.ok) {
      throw new UpstreamServiceError(
        `Product data source returned HTTP ${response.status}`,
      );
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new UpstreamServiceError('Product data source returned invalid JSON');
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      throw new UpstreamServiceError(
        'Product data source returned an unexpected payload',
      );
    }

    return parsed.data;
  }
}
