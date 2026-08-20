'use client';

import { useEffect, useState } from 'react';
import { pollsApi, PollWithDetails } from '@/lib/api';
import { PollCard } from '@/components/poll/PollCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { CATEGORY_EMOJIS } from '@/lib/constants';
import { clsx } from '@/lib/utils';

const FILTER_CATEGORIES = ['All', 'Football', 'Gaming', 'Music', 'Technology', 'Fashion', 'School', 'Entertainment', 'Food'];

export default function TrendingPage() {
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPolls = async (category: string, pageNum: number, replace: boolean) => {
    try {
      if (replace) setLoading(true); else setLoadingMore(true);
      const data = await pollsApi.trending({
        category: category === 'All' ? undefined : category,
        page: pageNum,
        limit: 10,
      });
      if (replace) setPolls(data.polls); else setPolls((p) => [...p, ...data.polls]);
      setHasMore(data.polls.length === 10);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPolls(activeCategory, 1, true);
  }, [activeCategory]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPolls(activeCategory, next, false);
  };

  const updatePoll = (updated: PollWithDetails) => {
    setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Trending 🔥</h1>
        <p className="text-gray-400 mt-0.5">The hottest polls right now</p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            )}
          >
            {cat !== 'All' && `${CATEGORY_EMOJIS[cat] || ''} `}{cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Loading trending polls..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchPolls(activeCategory, 1, true)} />
      ) : polls.length === 0 ? (
        <EmptyState
          title="No trending polls yet."
          description="Be the first to spark a conversation!"
          icon="🔥"
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
