import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { renderWithProviders } from './test/renderWithProviders';

const product = {
  id: 1,
  title: 'Fjallraven Backpack',
  price: 109.95,
  description: 'A durable everyday backpack with a padded laptop sleeve.',
  category: "men's clothing",
  image: 'https://example.com/backpack.jpg',
  rating: { rate: 4.5, count: 120 },
};

const secondProduct = {
  ...product,
  id: 2,
  title: 'Solid Gold Petite Micropave',
  category: 'jewelery',
};

const categories = ["men's clothing", 'jewelery'];

interface MockApiOptions {
  featured?: unknown[];
  category?: unknown;
  search?: unknown[];
  enquiry?: {
    status: number;
    body: unknown;
  };
}

function jsonResponse(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function mockApi(options: MockApiOptions = {}) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';

    if (method === 'POST' && url.endsWith('/enquiries')) {
      return jsonResponse(
        options.enquiry?.body ?? { status: 'sent' },
        options.enquiry?.status ?? 201,
      );
    }

    if (url.endsWith('/categories')) {
      return jsonResponse(categories);
    }

    if (url.includes('/categories/')) {
      return jsonResponse(
        options.category ?? {
          category: 'electronics',
          topRated: [product],
          additionalProducts: [secondProduct],
        },
      );
    }

    if (url.endsWith('/products/featured')) {
      return jsonResponse(options.featured ?? [product]);
    }

    if (url.endsWith('/products/1')) {
      return jsonResponse(product);
    }

    if (url.endsWith('/products/2')) {
      return jsonResponse(secondProduct);
    }

    if (url.includes('/products?search=')) {
      return jsonResponse(options.search ?? []);
    }

    return Promise.reject(new Error(`Unexpected request: ${method} ${url}`));
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders featured products and dynamic category navigation', async () => {
    mockApi();

    renderWithProviders(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Featured products' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Fjallraven Backpack')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: "Men's Clothing" })).toBeInTheDocument();
  });

  it('renders both category sections', async () => {
    mockApi();

    renderWithProviders(<App />, { route: '/category/electronics' });

    expect(
      await screen.findByRole('heading', { name: 'Top Rated in Electronics' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'More in Electronics' })).toBeInTheDocument();
    expect(await screen.findByText('Solid Gold Petite Micropave')).toBeInTheDocument();
  });

  it('renders search results with a matching count', async () => {
    mockApi({ search: [product] });

    renderWithProviders(<App />, { route: '/search?q=backpack' });

    expect(await screen.findByText('1 product found')).toBeInTheDocument();
    expect(screen.getByText('Fjallraven Backpack')).toBeInTheDocument();
  });

  it('shows a helpful empty state when a search has no matches', async () => {
    mockApi({ search: [] });

    renderWithProviders(<App />, { route: '/search?q=unknown' });

    expect(
      await screen.findByRole('heading', { name: 'No products found' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 products found')).toBeInTheDocument();
  });

  it('keeps the header search input in sync with navigation', async () => {
    mockApi({ search: [product] });

    renderWithProviders(<App />, { route: '/search?q=backpack' });

    const searchInput = screen.getByRole('searchbox', { name: 'Search products' });
    expect(searchInput).toHaveValue('backpack');

    fireEvent.click(screen.getByRole('link', { name: 'Home' }));

    expect(searchInput).toHaveValue('');
  });

  it('submits an enquiry and shows the success message', async () => {
    const fetchMock = mockApi();

    renderWithProviders(<App />, { route: '/product/1' });

    expect(
      await screen.findByRole('heading', { name: 'Fjallraven Backpack' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enquire About This Product' }));
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Is this backpack available in green?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(
      await screen.findByText('Thank you! Your enquiry has been sent to our sales team.'),
    ).toBeInTheDocument();

    const enquiryCall = fetchMock.mock.calls.find(([input, init]) => {
      return String(input).endsWith('/enquiries') && init?.method === 'POST';
    });

    expect(enquiryCall).toBeDefined();
    expect(enquiryCall?.[1]?.body).toBe(
      JSON.stringify({
        productId: 1,
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        message: 'Is this backpack available in green?',
      }),
    );
  });

  it('resets the enquiry form and mutation state when cancelled', async () => {
    mockApi({
      enquiry: {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'customerEmail: Invalid email address',
          },
        },
      },
    });

    renderWithProviders(<App />, { route: '/product/1' });

    expect(
      await screen.findByRole('heading', { name: 'Fjallraven Backpack' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enquire About This Product' }));
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Is this backpack available in green?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('customerEmail: Invalid email address')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enquire About This Product' }));

    expect(
      screen.queryByText('customerEmail: Invalid email address'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('');
    expect(screen.getByLabelText('Email address')).toHaveValue('');
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });

  it('shows the API error message when an enquiry fails', async () => {
    mockApi({
      enquiry: {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'customerEmail: Invalid email address',
          },
        },
      },
    });

    renderWithProviders(<App />, { route: '/product/1' });

    expect(
      await screen.findByRole('heading', { name: 'Fjallraven Backpack' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enquire About This Product' }));
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Is this backpack available in green?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }));

    expect(await screen.findByText('customerEmail: Invalid email address')).toBeInTheDocument();
  });
});
