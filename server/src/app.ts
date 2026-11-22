import cors from 'cors';
import express, { type Express } from 'express';
import { FakeStoreProductRepository } from './adapters/FakeStoreProductRepository.js';
import type { ProductRepository } from './adapters/ProductRepository.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ConsoleEmailProvider } from './providers/ConsoleEmailProvider.js';
import type { EmailProvider } from './providers/EmailProvider.js';
import { createCatalogueRouter } from './routes/catalogueRoutes.js';
import { healthRouter } from './routes/health.js';
import { ProductService } from './services/ProductService.js';

export interface AppDependencies {
  productRepository: ProductRepository;
  productService: ProductService;
  emailProvider: EmailProvider;
}

export function createApp(overrides: Partial<AppDependencies> = {}): Express {
  const productService =
    overrides.productService ??
    new ProductService(
      overrides.productRepository ??
        new FakeStoreProductRepository({
          baseUrl: env.FAKESTORE_BASE_URL,
        }),
    );

  const emailProvider = overrides.emailProvider ?? new ConsoleEmailProvider();

  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', createCatalogueRouter({ productService, emailProvider }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
