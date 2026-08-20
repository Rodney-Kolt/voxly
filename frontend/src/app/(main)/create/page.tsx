'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CreatePollForm } from '@/components/poll/CreatePollForm';
import { LoadingState } from '@/components/ui/LoadingState';

export default function CreatePollPage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState />;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="text-5xl">🔐</span>
        <h1 className="text-xl font-bold text-gray-900">Sign in to create a poll</h1>
        <p className="text-gray-400 text-sm">You need to be logged in to create polls.</p>
        <Link href="/login" className="btn-primary">
          Continue with Google
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Create a Poll ✍️</h1>
        <p className="text-gray-400 mt-0.5">Ask something and let the world decide.</p>
      </div>

      <div className="card p-6">
        <CreatePollForm />
      </div>
    </div>
  );
}
