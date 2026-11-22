import { Link, useParams } from 'react-router-dom';
import { useCategoryPage } from '../api/queries';
import ErrorState from '../components/ErrorState';
import ProductGrid from '../components/ProductGrid';
import ProductGridSkeleton from '../components/ProductGridSkeleton';
import { formatCategory, getErrorMessage } from '../lib/format';
import NotFoundPage from './NotFoundPage';

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const categorySlug = params.slug?.trim() ?? '';
  const categoryPage = useCategoryPage(categorySlug);

  if (categorySlug.length === 0) {
    return (
      <NotFoundPage
        title="Category not found"
        message="Choose a category from the navigation above to browse products."
      />
    );
  }

  const categoryName = formatCategory(categoryPage.data?.category ?? categorySlug);
  const productCount = categoryPage.data
    ? categoryPage.data.topRated.length + categoryPage.data.additionalProducts.length
    : 0;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <span aria-hidden="true">&larr;</span>
          Back to all products
        </Link>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{categoryName}</h1>
        {categoryPage.isSuccess ? (
          <p className="text-sm text-slate-600">
            {productCount} {productCount === 1 ? 'product' : 'products'} in this category.
          </p>
        ) : null}
      </div>

      {categoryPage.isPending ? <ProductGridSkeleton count={6} /> : null}

      {categoryPage.isError ? (
        <ErrorState
          title={`We couldn't load ${categoryName}`}
          message={getErrorMessage(categoryPage.error)}
          onRetry={() => void categoryPage.refetch()}
        />
      ) : null}

      {categoryPage.isSuccess ? (
        <>
          <section aria-labelledby="top-rated-heading" className="space-y-5">
            <h2 id="top-rated-heading" className="text-xl font-semibold tracking-tight">
              Top Rated in {categoryName}
            </h2>
            {categoryPage.data.topRated.length > 0 ? (
              <ProductGrid products={categoryPage.data.topRated} />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
                No top-rated products are available in this category yet.
              </p>
            )}
          </section>

          <section aria-labelledby="more-products-heading" className="space-y-5">
            <h2 id="more-products-heading" className="text-xl font-semibold tracking-tight">
              More in {categoryName}
            </h2>
            {categoryPage.data.additionalProducts.length > 0 ? (
              <ProductGrid products={categoryPage.data.additionalProducts} />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
                This category has no additional products.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
