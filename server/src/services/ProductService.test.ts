import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../errors/AppError.js';
import { InMemoryProductRepository } from '../testing/fakes.js';
import { ProductService } from './ProductService.js';

function createService(): ProductService {
  return new ProductService(new InMemoryProductRepository());
}

function ids(products: { id: number }[]): number[] {
  return products.map((product) => product.id);
}

describe('ProductService', () => {
  it('ranks top rated products by rate and then count', async () => {
    const products = await createService().getTopRated();

    expect(ids(products)).toEqual([3, 5, 2, 1, 6]);
  });

  it('honours a custom top rated limit', async () => {
    const products = await createService().getTopRated(2);

    expect(ids(products)).toEqual([3, 5]);
  });

  it('splits a category into top three and non-duplicated remainder', async () => {
    const page = await createService().getCategoryPageData("men's clothing");

    expect(page.category).toBe("men's clothing");
    expect(ids(page.topRated)).toEqual([3, 2, 1]);
    expect(ids(page.additionalProducts)).toEqual([4]);

    const allIds = [...page.topRated, ...page.additionalProducts].map(
      (product) => product.id,
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('matches categories case-insensitively', async () => {
    const page = await createService().getCategoryPageData("MEN'S CLOTHING");

    expect(page.category).toBe("men's clothing");
    expect(page.topRated).toHaveLength(3);
  });

  it('throws NotFoundError for an unknown category', async () => {
    await expect(
      createService().getCategoryPageData('unknown'),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('searches title and description case-insensitively', async () => {
    const service = createService();

    expect(ids(await service.searchProducts('JACKET'))).toEqual([3]);
    expect(ids(await service.searchProducts('diamond'))).toEqual([6]);
    expect(await service.searchProducts('no-such-product')).toEqual([]);
  });

  it('returns every product for an empty search term', async () => {
    const products = await createService().searchProducts('');

    expect(products).toHaveLength(6);
  });

  it('returns a product by id and throws for a missing product', async () => {
    const service = createService();

    await expect(service.getProductById(5)).resolves.toMatchObject({
      id: 5,
      category: 'jewelery',
    });
    await expect(service.getProductById(999)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('exposes repository categories', async () => {
    await expect(createService().getCategories()).resolves.toEqual([
      "men's clothing",
      'jewelery',
    ]);
  });
});
