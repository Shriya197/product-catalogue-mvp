import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '../testing/fakes.js';
import { ConsoleEmailProvider } from './ConsoleEmailProvider.js';

describe('ConsoleEmailProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a formatted enquiry summary to stdout', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const product = sampleProducts.find((item) => item.id === 1);

    if (!product) {
      throw new Error('Missing product fixture');
    }

    const provider = new ConsoleEmailProvider(false);

    await provider.sendEnquiry(
      {
        productId: 1,
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        message: 'Is this backpack still available?',
      },
      product,
    );

    expect(log).toHaveBeenCalledTimes(1);
    const output = log.mock.calls[0]?.[0];

    expect(output).toContain('New enquiry: Fjallraven');
    expect(output).toContain('Ada Lovelace <ada@example.com>');
    expect(output).toContain('Is this backpack still available?');
    expect(output).toContain('sales@example.com');
  });
});
