export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class UpstreamServiceError extends AppError {
  constructor(message = 'Product data source is unavailable') {
    super('UPSTREAM_SERVICE_ERROR', message, 502);
  }
}

export class EmailDeliveryError extends AppError {
  constructor(message = 'Unable to deliver the enquiry email') {
    super('EMAIL_DELIVERY_FAILED', message, 502);
  }
}
