import type { ProductRepository } from '../adapters/ProductRepository.js';
import type { EmailProvider } from '../providers/EmailProvider.js';
import type { EnquiryPayload, Product } from '../types/domain.js';

export const sampleProducts: Product[] = [
  {
    id: 1,
    title: 'Fjallraven - Foldsack No. 1 Backpack',
    price: 109.95,
    description: 'Your perfect pack for everyday use and walks in the forest.',
    category: "men's clothing",
    image: 'https://images.example.com/1.jpg',
    rating: { rate: 3.9, count: 120 },
  },
  {
    id: 2,
    title: 'Mens Casual Premium Slim Fit T-Shirts',
    price: 22.3,
    description: 'Slim-fitting style, contrast raglan long sleeve.',
    category: "men's clothing",
    image: 'https://images.example.com/2.jpg',
    rating: { rate: 4.1, count: 259 },
  },
  {
    id: 3,
    title: 'Mens Cotton Jacket',
    price: 55.99,
    description: 'Great outerwear jackets for Spring, Autumn and Winter.',
    category: "men's clothing",
    image: 'https://images.example.com/3.jpg',
    rating: { rate: 4.7, count: 500 },
  },
  {
    id: 4,
    title: 'Mens Casual Slim Fit Jeans',
    price: 15.99,
    description: 'The color could be slightly different on the screen.',
    category: "men's clothing",
    image: 'https://images.example.com/4.jpg',
    rating: { rate: 2.1, count: 430 },
  },
  {
    id: 5,
    title: "John Hardy Women's Legends Naga Gold Bracelet",
    price: 695,
    description: 'From our Legends Collection, inspired by the mythical water dragon.',
    category: 'jewelery',
    image: 'https://images.example.com/5.jpg',
    rating: { rate: 4.6, count: 400 },
  },
  {
    id: 6,
    title: 'Solid Gold Petite Micropave Ring',
    price: 168,
    description: 'Classic Created Wedding Engagement Solitaire Diamond Promise Ring.',
    category: 'jewelery',
    image: 'https://images.example.com/6.jpg',
    rating: { rate: 3.9, count: 70 },
  },
];

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = sampleProducts) {}

  async getAll(): Promise<Product[]> {
    return [...this.products];
  }

  async getById(id: number): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async getCategories(): Promise<string[]> {
    return [...new Set(this.products.map((product) => product.category))];
  }
}

export interface SentEnquiry {
  enquiry: EnquiryPayload;
  product: Product;
}

export class RecordingEmailProvider implements EmailProvider {
  readonly sent: SentEnquiry[] = [];

  async sendEnquiry(
    enquiry: EnquiryPayload,
    product: Product,
  ): Promise<void> {
    this.sent.push({ enquiry, product });
  }
}
