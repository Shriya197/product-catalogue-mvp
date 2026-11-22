import { Link } from 'react-router-dom';
import { formatCategory, formatPrice } from '../lib/format';
import type { Product } from '../types/domain';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.id}`} className="flex h-full flex-col">
        <div className="flex h-44 items-center justify-center bg-white p-6">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 border-t border-slate-100 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {formatCategory(product.category)}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
            {product.title}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <span className="text-base font-semibold text-slate-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-slate-600">
              {product.rating.rate.toFixed(1)} / 5 ({product.rating.count})
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
