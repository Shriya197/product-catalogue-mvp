import { useSearchParams } from 'react-router-dom';
import { useSearchProducts } from '../api/queries';
import ErrorState from '../components/ErrorState';
import ProductGrid from '../components/ProductGrid';
import ProductGridSkeleton from '../components/ProductGridSkeleton';
import { getErrorMessage } from '../lib/format';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const searchResults = useSearchProducts(query);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Search</h1>
        {query.length > 0 ? (
          <p className="text-sm text-slate-600">
            Showing results for <span className="font-semibold text-slate-900">{query}</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Use the search bar above to find products by name or description.
          </p>
        )}
      </div>

      {query.length > 0 && searchResults.isPending ? (
        <ProductGridSkeleton count={5} />
      ) : null}

      {query.length > 0 && searchResults.isError ? (
        <ErrorState
          title="We couldn't run that search"
          message={getErrorMessage(searchResults.error)}
          onRetry={() => void searchResults.refetch()}
        />
      ) : null}

      {query.length > 0 && searchResults.isSuccess ? (
        <>
          <p role="status" className="text-sm font-medium text-slate-600">
            {searchResults.data.length}{' '}
            {searchResults.data.length === 1 ? 'product' : 'products'} found
          </p>
          {searchResults.data.length > 0 ? (
            <ProductGrid products={searchResults.data} />
          ) : (
            <NoResults query={query} />
          )}
        </>
      ) : null}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No products found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        We couldn't find anything matching &ldquo;{query}&rdquo;. Try a different search term or
        browse the categories above.
      </p>
    </div>
  );
}
