import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { EmailDeliveryError } from '../errors/AppError.js';
import type { EnquiryPayload, Product } from '../types/domain.js';
import type { EmailProvider } from './EmailProvider.js';

function formatSummary(enquiry: EnquiryPayload, product: Product): string {
  return [
    `Product: ${product.title} (#${product.id})`,
    `Category: ${product.category}`,
    `Price: $${product.price.toFixed(2)}`,
    `Customer: ${enquiry.customerName} <${enquiry.customerEmail}>`,
    `Message: ${enquiry.message}`,
    `Send to: ${env.SALES_INBOX_EMAIL}`,
  ].join('\n');
}

export class ConsoleEmailProvider implements EmailProvider {
  private readonly smtpEnabled: boolean;
  private transporter: Transporter | undefined;

  constructor(smtpEnabled = Boolean(env.SMTP_HOST)) {
    this.smtpEnabled = smtpEnabled;
  }

  async sendEnquiry(
    enquiry: EnquiryPayload,
    product: Product,
  ): Promise<void> {
    const subject = `New enquiry: ${product.title}`;
    const text = formatSummary(enquiry, product);

    console.log(`[email] ${subject}\n${text}`);

    if (!this.smtpEnabled) {
      return;
    }

    try {
      await this.getTransporter().sendMail({
        from: env.SMTP_FROM ?? env.SMTP_USER ?? 'no-reply@example.com',
        to: env.SALES_INBOX_EMAIL,
        replyTo: `${enquiry.customerName} <${enquiry.customerEmail}>`,
        subject,
        text,
      });
    } catch (error) {
      console.error('[email] SMTP delivery failed', error);
      throw new EmailDeliveryError();
    }
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
      });
    }

    return this.transporter;
  }
}
