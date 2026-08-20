'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ActivityPage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="text-5xl">🔔</span>
        <h1 className="text-xl font-bold text-gray-900">Sign in to see your activity</h1>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Activity 🔔</h1>
        <p className="text-gray-400 mt-0.5">Notifications coming in V2.</p>
      </div>

      <div className="card p-8 text-center">
        <p className="text-4xl mb-3">🚀</p>
        <h2 className="text-lg font-bold text-gray-800">Notifications coming soon</h2>
        <p className="text-sm text-gray-400 mt-1">
          We&apos;re working on activity notifications for V2. Stay tuned!
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/" className="btn-secondary text-sm">Browse Polls</Link>
          <Link href="/create" className="btn-primary text-sm">Create a Poll</Link>
        </div>
      </div>
    </div>
  );
}
