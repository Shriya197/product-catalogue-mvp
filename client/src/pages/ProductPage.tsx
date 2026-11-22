import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct, useSendEnquiry } from '../api/queries';
import ErrorState from '../components/ErrorState';
import { formatCategory, formatPrice, getErrorMessage } from '../lib/format';
import NotFoundPage from './NotFoundPage';

interface EnquiryFormState {
  customerName: string;
  customerEmail: string;
  message: string;
}

const emptyForm: EnquiryFormState = {
  customerName: '',
  customerEmail: '',
  message: '',
};

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return (
      <NotFoundPage
        title="Product not found"
        message="This product link is invalid. Browse the catalogue to find another item."
      />
    );
  }

  return <ProductDetails productId={productId} />;
}

function ProductDetails({ productId }: { productId: number }) {
  const productQuery = useProduct(productId);
  const enquiry = useSendEnquiry();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EnquiryFormState>(emptyForm);

  function updateField(field: keyof EnquiryFormState) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [field]: value }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    enquiry.mutate({
      productId,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      message: form.message.trim(),
    });
  }

  function handleCancel() {
    setForm(emptyForm);
    enquiry.reset();
    setShowForm(false);
  }

  if (productQuery.isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ProductDetailsSkeleton />
      </div>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="We couldn't load this product"
          message={getErrorMessage(productQuery.error)}
          onRetry={() => void productQuery.refetch()}
        />
      </div>
    );
  }

  const product = productQuery.data;
  const reviewLabel = product.rating.count === 1 ? 'review' : 'reviews';

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <img
            src={product.image}
            alt={product.title}
            className="max-h-[28rem] w-full object-contain"
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Link
              to={`/category/${encodeURIComponent(product.category)}`}
              className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {formatCategory(product.category)}
            </Link>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {product.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-3xl font-semibold text-slate-900">
                {formatPrice(product.price)}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {product.rating.rate.toFixed(1)} / 5
              </span>
              <span className="text-sm text-slate-500">
                {product.rating.count} {reviewLabel}
              </span>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-600">{product.description}</p>

          <div className="border-t border-slate-200 pt-6">
            {enquiry.isSuccess ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
              >
                <h2 className="text-lg font-semibold text-emerald-900">Enquiry sent</h2>
                <p className="mt-2 text-sm text-emerald-800">
                  Thank you! Your enquiry has been sent to our sales team.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {showForm ? (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Enquire about this product
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Send a question to our sales team and we will follow up by email.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Full name
                        <input
                          type="text"
                          value={form.customerName}
                          onChange={updateField('customerName')}
                          required
                          minLength={2}
                          maxLength={100}
                          autoComplete="name"
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>

                      <label className="block text-sm font-medium text-slate-700">
                        Email address
                        <input
                          type="email"
                          value={form.customerEmail}
                          onChange={updateField('customerEmail')}
                          required
                          maxLength={254}
                          autoComplete="email"
                          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                      Message
                      <textarea
                        value={form.message}
                        onChange={updateField('message')}
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={4}
                        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                      />
                    </label>
                    <p className="text-xs text-slate-500">Please include at least 10 characters.</p>

                    {enquiry.isError ? (
                      <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      >
                        {getErrorMessage(enquiry.error)}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={enquiry.isPending}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {enquiry.isPending ? 'Sending...' : 'Send enquiry'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={enquiry.isPending}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  >
                    Enquire About This Product
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
    >
      <span aria-hidden="true">&larr;</span>
      Back to all products
    </Link>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="grid gap-8 lg:grid-cols-2 lg:gap-12"
    >
      <span className="sr-only">Loading product...</span>
      <div
        aria-hidden="true"
        className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white"
      />
      <div aria-hidden="true" className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
