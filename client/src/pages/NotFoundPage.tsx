import { Link } from 'react-router-dom';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

export default function NotFoundPage({
  title = 'Page not found',
  message = 'The page you are looking for does not exist.',
}: NotFoundPageProps) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        Back to home
      </Link>
    </div>
  );
}
