import { Router } from 'express';
import { z } from 'zod';
import type { EmailProvider } from '../providers/EmailProvider.js';
import type { ProductService } from '../services/ProductService.js';

const productIdSchema = z.coerce.number().int().positive();

const categoryParamsSchema = z.object({
  category: z.string().trim().min(1).max(100),
});

const productQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
});

const enquirySchema = z.object({
  productId: z.coerce.number().int().positive(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(2000),
});

export interface CatalogueRouterDependencies {
  productService: ProductService;
  emailProvider: EmailProvider;
}

export function createCatalogueRouter({
  productService,
  emailProvider,
}: CatalogueRouterDependencies): Router {
  const router = Router();

  router.get('/products/featured', async (_req, res) => {
    const products = await productService.getTopRated();
    res.status(200).json(products);
  });

  router.get('/categories', async (_req, res) => {
    const categories = await productService.getCategories();
    res.status(200).json(categories);
  });

  router.get('/categories/:category', async (req, res) => {
    const { category } = categoryParamsSchema.parse(req.params);
    const page = await productService.getCategoryPageData(category);
    res.status(200).json(page);
  });

  router.get('/products', async (req, res) => {
    const { search } = productQuerySchema.parse(req.query);
    const products = await productService.searchProducts(search ?? '');
    res.status(200).json(products);
  });

  router.get('/products/:id', async (req, res) => {
    const id = productIdSchema.parse(req.params.id);
    const product = await productService.getProductById(id);
    res.status(200).json(product);
  });

  router.post('/enquiries', async (req, res) => {
    const enquiry = enquirySchema.parse(req.body);
    const product = await productService.getProductById(enquiry.productId);

    await emailProvider.sendEnquiry(enquiry, product);

    res.status(201).json({ status: 'sent' });
  });

  return router;
}
