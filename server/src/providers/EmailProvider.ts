import type { EnquiryPayload, Product } from '../types/domain.js';

export interface EmailProvider {
  sendEnquiry(enquiry: EnquiryPayload, product: Product): Promise<void>;
}
