import type { Product } from '../types/domain.js';

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: number): Promise<Product | null>;
  getCategories(): Promise<string[]>;
}
