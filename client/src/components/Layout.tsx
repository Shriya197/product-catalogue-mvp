import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCategories } from '../api/queries';
import { formatCategory } from '../lib/format';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSearchRoute =
    location.pathname === '/search' || location.pathname === '/search/';
  const activeSearchQuery = isSearchRoute
    ? (new URLSearchParams(location.search).get('q') ?? '')
    : '';
  const [searchTerm, setSearchTerm] = useState(activeSearchQuery);
  const categories = useCategories();

  useEffect(() => {
    setSearchTerm(activeSearchQuery);
  }, [activeSearchQuery]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();

    if (query.length === 0) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <Link to="/" className="flex items-center gap-3 self-start">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold tracking-wide text-white"
            >
              PC
            </span>
            <span className="text-lg font-semibold tracking-tight">Product Catalogue</span>
          </Link>

          <form
            role="search"
            onSubmit={handleSearch}
            className="flex w-full max-w-xl items-center gap-2 lg:ml-auto"
          >
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>

        <nav
          aria-label="Categories"
          className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-1 px-4 pb-3 sm:px-6"
        >
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          {categories.isPending ? (
            <span className="px-3 py-2 text-xs text-slate-400">Loading categories...</span>
          ) : null}

          {categories.isError ? (
            <span className="px-3 py-2 text-xs text-slate-400">Categories unavailable</span>
          ) : null}

          {categories.data?.map((category) => (
            <NavLink
              key={category}
              to={`/category/${encodeURIComponent(category)}`}
              className={navLinkClass}
            >
              {formatCategory(category)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Product Catalogue MVP</p>
          <p>Data served through the catalogue API.</p>
        </div>
      </footer>
    </div>
  );
}
