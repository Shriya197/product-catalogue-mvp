const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

export function formatCategory(category: string): string {
  return category.replace(/(^|[\s-])([a-z])/g, (_match, separator: string, letter: string) => {
    return `${separator}${letter.toUpperCase()}`;
  });
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
