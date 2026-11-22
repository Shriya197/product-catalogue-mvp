import { useFeaturedProducts } from '../api/queries';
import ErrorState from '../components/ErrorState';
import ProductGrid from '../components/ProductGrid';
import ProductGridSkeleton from '../components/ProductGridSkeleton';
import { getErrorMessage } from '../lib/format';

export default function HomePage() {
  const featuredProducts = useFeaturedProducts();

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-2xl bg-slate-900 px-6 py-10 text-white shadow-sm sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Curated for you
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Featured products</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Our five highest-rated picks, refreshed directly from the catalogue.
        </p>
      </section>

      <section aria-labelledby="featured-heading" className="space-y-5">
        <div>
          <h2 id="featured-heading" className="text-xl font-semibold tracking-tight">
            Top rated right now
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ranked by average rating, then by number of reviews.
          </p>
        </div>

        {featuredProducts.isPending ? <ProductGridSkeleton count={5} /> : null}

        {featuredProducts.isError ? (
          <ErrorState
            title="We couldn't load featured products"
            message={getErrorMessage(featuredProducts.error)}
            onRetry={() => void featuredProducts.refetch()}
          />
        ) : null}

        {featuredProducts.isSuccess && featuredProducts.data.length > 0 ? (
          <ProductGrid products={featuredProducts.data} />
        ) : null}

        {featuredProducts.isSuccess && featuredProducts.data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
            No featured products are available right now.
          </p>
        ) : null}
      </section>
    </div>
  );
}
