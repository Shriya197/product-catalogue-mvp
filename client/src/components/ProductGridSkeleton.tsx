interface ProductGridSkeletonProps {
  count?: number;
}

export default function ProductGridSkeleton({ count = 5 }: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5"
    >
      <span className="sr-only">Loading products...</span>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={`product-skeleton-${index}`}
          aria-hidden="true"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="h-44 animate-pulse bg-slate-100" />
          <div className="space-y-3 border-t border-slate-100 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
