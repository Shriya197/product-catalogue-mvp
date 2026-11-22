import { describe, expect, it, vi } from 'vitest';
import { UpstreamServiceError } from '../errors/AppError.js';
import {
  FakeStoreProductRepository,
  type FetchLike,
} from './FakeStoreProductRepository.js';

const rawProduct = {
  id: 1,
  title: 'Test product',
  price: 9.99,
  description: 'A product used in adapter tests.',
  category: 'test',
  image: 'https://images.example.com/test.jpg',
  rating: { rate: 4.2, count: 7 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function createRepository(fetchImpl: FetchLike) {
  return new FakeStoreProductRepository({
    baseUrl: 'https://fake-store.test/',
    fetchImpl,
  });
}

describe('FakeStoreProductRepository', () => {
  it('maps upstream payloads into the canonical Product model', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse([rawProduct]));
    const repository = createRepository(fetchImpl);

    const products = await repository.getAll();

    expect(products).toEqual([
      {
        id: 1,
        title: 'Test product',
        price: 9.99,
        description: 'A product used in adapter tests.',
        category: 'test',
        image: 'https://images.example.com/test.jpg',
        rating: { rate: 4.2, count: 7 },
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://fake-store.test/products',
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });

  it('reads fresh data from upstream on each call', async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockImplementation(async () => jsonResponse([rawProduct]));
    const repository = createRepository(fetchImpl);

    await repository.getAll();
    await repository.getAll();

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns null when a product does not exist', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse([rawProduct]));
    const repository = createRepository(fetchImpl);

    await expect(repository.getById(99)).resolves.toBeNull();
  });

  it('derives categories from normalized products', async () => {
    const otherProduct = {
      ...rawProduct,
      id: 2,
      category: 'other',
    };
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse([rawProduct, otherProduct]));
    const repository = createRepository(fetchImpl);

    await expect(repository.getCategories()).resolves.toEqual([
      'test',
      'other',
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://fake-store.test/products',
      expect.any(Object),
    );
  });

  it('wraps network failures in UpstreamServiceError', async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockRejectedValue(new Error('socket hang up'));
    const repository = createRepository(fetchImpl);

    await expect(repository.getAll()).rejects.toMatchObject({
      code: 'UPSTREAM_SERVICE_ERROR',
      statusCode: 502,
    });
    await expect(repository.getAll()).rejects.toBeInstanceOf(
      UpstreamServiceError,
    );
  });

  it('wraps non-2xx responses in UpstreamServiceError', async () => {
    const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({}, 500));
    const repository = createRepository(fetchImpl);

    await expect(repository.getAll()).rejects.toMatchObject({
      code: 'UPSTREAM_SERVICE_ERROR',
      message: 'Product data source returned HTTP 500',
    });
  });

  it('rejects unexpected upstream payloads', async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(jsonResponse([{ id: 'not-a-number' }]));
    const repository = createRepository(fetchImpl);

    await expect(repository.getAll()).rejects.toMatchObject({
      code: 'UPSTREAM_SERVICE_ERROR',
      message: 'Product data source returned an unexpected payload',
    });
  });

  it('rejects invalid upstream JSON', async () => {
    const fetchImpl = vi
      .fn<FetchLike>()
      .mockResolvedValue(new Response('not-json', { status: 200 }));
    const repository = createRepository(fetchImpl);

    await expect(repository.getAll()).rejects.toMatchObject({
      code: 'UPSTREAM_SERVICE_ERROR',
      message: 'Product data source returned invalid JSON',
    });
  });
});
