export interface ProductRating {
  rate: number;
  count: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: ProductRating;
}

export interface CategoryProductsResponse {
  category: string;
  topRated: Product[];
  additionalProducts: Product[];
}

export interface EnquiryPayload {
  productId: number;
  customerName: string;
  customerEmail: string;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
