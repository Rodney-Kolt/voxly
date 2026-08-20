import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">🗳️</p>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">This page doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary inline-flex">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
