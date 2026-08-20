'use client';

import { useEffect, useState } from 'react';
import { pollsApi, PollWithDetails } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PollCard } from '@/components/poll/PollCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPolls = async (pageNum = 1, replace = true) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const data = await pollsApi.list({ page: pageNum, limit: 10 });
      if (replace) {
        setPolls(data.polls);
      } else {
        setPolls((prev) => [...prev, ...data.polls]);
      }
      setHasMore(data.polls.length === 10);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load polls.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPolls(1, true);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPolls(next, false);
  };

  const updatePoll = (updated: PollWithDetails) => {
    setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  if (loading || authLoading) return <LoadingState message="Loading polls..." />;
  if (error) return <ErrorState message={error} onRetry={() => fetchPolls(1, true)} />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2 pb-1">
        {user ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user.displayName.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-400 mt-0.5">What&apos;s everyone voting on?</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">What&apos;s everyone voting on? 🗳️</h1>
            <p className="text-gray-400 mt-0.5">
              <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link> to vote and create polls.
            </p>
          </>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-700">Latest Polls</h2>
        <Link href="/trending" className="text-sm text-primary-600 font-medium hover:underline">
          See trending →
        </Link>
      </div>

      {/* Polls */}
      {polls.length === 0 ? (
        <EmptyState
          title="No polls yet."
          description="Be the first to ask something!"
          icon="🗳️"
          action={
            user ? (
              <Link href="/create">
                <Button>Create the first poll</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} onUpdate={updatePoll} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
