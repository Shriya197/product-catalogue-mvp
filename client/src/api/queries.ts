import { useMutation, useQuery } from '@tanstack/react-query';
import type { EnquiryPayload } from '../types/domain';
import { catalogueApi } from './client';

export const queryKeys = {
  categories: ['categories'] as const,
  featuredProducts: ['products', 'featured'] as const,
  category: (category: string) => ['categories', category] as const,
  product: (id: number) => ['products', id] as const,
  search: (query: string) => ['products', 'search', query] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: catalogueApi.getCategories,
    staleTime: 5 * 60_000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.featuredProducts,
    queryFn: catalogueApi.getFeaturedProducts,
  });
}

export function useCategoryPage(category: string) {
  return useQuery({
    queryKey: queryKeys.category(category),
    queryFn: () => catalogueApi.getCategoryPage(category),
    enabled: category.length > 0,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => catalogueApi.getProduct(id),
    enabled: id > 0,
  });
}

export function useSearchProducts(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: queryKeys.search(normalizedQuery),
    queryFn: () => catalogueApi.searchProducts(normalizedQuery),
    enabled: normalizedQuery.length > 0,
  });
}

export function useSendEnquiry() {
  return useMutation({
    mutationFn: (payload: EnquiryPayload) => catalogueApi.sendEnquiry(payload),
  });
}
