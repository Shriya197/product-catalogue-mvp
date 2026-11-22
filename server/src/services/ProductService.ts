import type { ProductRepository } from '../adapters/ProductRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import type { CategoryProductsResponse, Product } from '../types/domain.js';

const TOP_RATED_CATEGORY_LIMIT = 3;

function compareByRating(a: Product, b: Product): number {
  if (b.rating.rate !== a.rating.rate) {
    return b.rating.rate - a.rating.rate;
  }

  return b.rating.count - a.rating.count;
}

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getTopRated(limit = 5): Promise<Product[]> {
    const products = await this.repository.getAll();
    const safeLimit = Math.max(0, Math.floor(limit));

    return [...products].sort(compareByRating).slice(0, safeLimit);
  }

  async getCategoryPageData(
    category: string,
  ): Promise<CategoryProductsResponse> {
    const products = await this.repository.getAll();
    const normalizedCategory = category.trim().toLowerCase();
    const categoryProducts = products.filter(
      (product) => product.category.toLowerCase() === normalizedCategory,
    );

    if (categoryProducts.length === 0) {
      throw new NotFoundError(`Category "${category}" not found`);
    }

    const sortedProducts = [...categoryProducts].sort(compareByRating);
    const topRated = sortedProducts.slice(0, TOP_RATED_CATEGORY_LIMIT);
    const topRatedIds = new Set(topRated.map((product) => product.id));
    const additionalProducts = sortedProducts.filter(
      (product) => !topRatedIds.has(product.id),
    );

    return {
      category: categoryProducts[0]?.category ?? category,
      topRated,
      additionalProducts,
    };
  }

  async searchProducts(query: string): Promise<Product[]> {
    const term = query.trim().toLowerCase();
    const products = await this.repository.getAll();

    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term),
    );
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.repository.getById(id);

    if (!product) {
      throw new NotFoundError(`Product ${id} not found`);
    }

    return product;
  }

  async getCategories(): Promise<string[]> {
    return this.repository.getCategories();
  }
}
