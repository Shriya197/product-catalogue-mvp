import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { ProductRepository } from '../adapters/ProductRepository.js';
import { createApp } from '../app.js';
import { EmailDeliveryError, UpstreamServiceError } from '../errors/AppError.js';
import type { EmailProvider } from '../providers/EmailProvider.js';
import {
  InMemoryProductRepository,
  RecordingEmailProvider,
  sampleProducts,
} from '../testing/fakes.js';
import type { Product } from '../types/domain.js';

class FailingProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    throw new UpstreamServiceError();
  }

  async getById(_id: number): Promise<Product | null> {
    throw new UpstreamServiceError();
  }

  async getCategories(): Promise<string[]> {
    throw new UpstreamServiceError();
  }
}

class FailingEmailProvider implements EmailProvider {
  async sendEnquiry(): Promise<void> {
    throw new EmailDeliveryError();
  }
}

function setup(repository: ProductRepository = new InMemoryProductRepository()) {
  const emailProvider = new RecordingEmailProvider();
  const app = createApp({ productRepository: repository, emailProvider });

  return { app, emailProvider };
}

describe('catalogue routes', () => {
  it('GET /api/products/featured returns top rated products', async () => {
    const { app } = setup();

    const response = await request(app).get('/api/products/featured');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(response.body.map((product: Product) => product.id)).toEqual([
      3, 5, 2, 1, 6,
    ]);
  });

  it('GET /api/categories returns category names', async () => {
    const { app } = setup();

    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(["men's clothing", 'jewelery']);
  });

  it('GET /api/categories/:category returns top rated and additional products', async () => {
    const { app } = setup();

    const response = await request(app).get(
      `/api/categories/${encodeURIComponent("men's clothing")}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.category).toBe("men's clothing");
    expect(response.body.topRated.map((product: Product) => product.id)).toEqual(
      [3, 2, 1],
    );
    expect(
      response.body.additionalProducts.map((product: Product) => product.id),
    ).toEqual([4]);
  });

  it('GET /api/categories/:category returns 404 for unknown categories', async () => {
    const { app } = setup();

    const response = await request(app).get('/api/categories/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Category "unknown" not found',
      },
    });
  });

  it('GET /api/products searches title and description', async () => {
    const { app } = setup();

    const searchResponse = await request(app).get('/api/products?search=JACKET');
    const allResponse = await request(app).get('/api/products');

    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.map((product: Product) => product.id)).toEqual([
      3,
    ]);
    expect(allResponse.status).toBe(200);
    expect(allResponse.body).toHaveLength(sampleProducts.length);
  });

  it('GET /api/products/:id returns a product and validates ids', async () => {
    const { app } = setup();

    const found = await request(app).get('/api/products/5');
    const invalid = await request(app).get('/api/products/abc');
    const missing = await request(app).get('/api/products/999');

    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({ id: 5, category: 'jewelery' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/enquiries sends an enquiry for an existing product', async () => {
    const { app, emailProvider } = setup();

    const response = await request(app).post('/api/enquiries').send({
      productId: 1,
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
      message: 'Is this backpack still available?',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ status: 'sent' });
    expect(emailProvider.sent).toHaveLength(1);
    expect(emailProvider.sent[0]?.product.id).toBe(1);
    expect(emailProvider.sent[0]?.enquiry.customerEmail).toBe(
      'ada@example.com',
    );
  });

  it('POST /api/enquiries validates the payload', async () => {
    const { app, emailProvider } = setup();

    const response = await request(app).post('/api/enquiries').send({
      productId: 1,
      customerName: 'Ada Lovelace',
      customerEmail: 'not-an-email',
      message: 'Is this backpack still available?',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('customerEmail');
    expect(emailProvider.sent).toHaveLength(0);
  });

  it('POST /api/enquiries returns 404 when the product does not exist', async () => {
    const { app, emailProvider } = setup();

    const response = await request(app).post('/api/enquiries').send({
      productId: 999,
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
      message: 'Is this backpack still available?',
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(emailProvider.sent).toHaveLength(0);
  });

  it('maps email delivery failures to a 502 error envelope', async () => {
    const app = createApp({
      productRepository: new InMemoryProductRepository(),
      emailProvider: new FailingEmailProvider(),
    });

    const response = await request(app).post('/api/enquiries').send({
      productId: 1,
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
      message: 'Is this backpack still available?',
    });

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_DELIVERY_FAILED',
        message: 'Unable to deliver the enquiry email',
      },
    });
  });

  it('POST /api/enquiries rejects malformed JSON', async () => {
    const { app } = setup();

    const response = await request(app)
      .post('/api/enquiries')
      .set('content-type', 'application/json')
      .send('{"productId":');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('maps upstream failures to a 502 error envelope', async () => {
    const { app } = setup(new FailingProductRepository());

    const response = await request(app).get('/api/products/featured');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: {
        code: 'UPSTREAM_SERVICE_ERROR',
        message: 'Product data source is unavailable',
      },
    });
  });
});
