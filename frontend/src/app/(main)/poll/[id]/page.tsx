'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Share2, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { pollsApi, PollWithDetails } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PollOption } from '@/components/poll/PollOption';
import { CommentList } from '@/components/comments/CommentList';
import { UserAvatar } from '@/components/user/UserAvatar';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { timeAgo, formatNumber } from '@/lib/utils';
import { CATEGORY_EMOJIS } from '@/lib/constants';

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [poll, setPoll] = useState<PollWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await pollsApi.get(id);
        setPoll(data.poll);
        setSelectedOptionId(data.poll.userVotedOptionId);
      } catch (err: any) {
        setError(err.message || 'Poll not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const handleVote = async () => {
    if (!user) {
      toast.error('Sign in to vote!');
      return;
    }
    if (!selectedOptionId || !poll || poll.userVotedOptionId || voting) return;

    setVoting(true);
    try {
      const data = await pollsApi.vote(poll.id, selectedOptionId);
      setPoll(data.poll);
      toast.success('Vote recorded! 🗳️');
    } catch (err: any) {
      toast.error(err.message || 'Failed to vote.');
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!poll || !confirm('Delete this poll? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await pollsApi.delete(poll.id);
      toast.success('Poll deleted.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete.');
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: poll?.question, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  if (loading) return <LoadingState message="Loading poll..." />;
  if (error || !poll) return <ErrorState message={error || 'Poll not found.'} />;

  const hasVoted = poll.userVotedOptionId !== null;
  const isOwner = user?.id === poll.creator.id;
  const categoryEmoji = CATEGORY_EMOJIS[poll.category] || '💬';
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount));

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Poll card */}
      <article className="card p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/profile/${poll.creator.username}`} className="flex items-center gap-3 group">
            <UserAvatar
              avatarUrl={poll.creator.avatarUrl}
              username={poll.creator.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {poll.creator.displayName}
              </p>
              <p className="text-xs text-gray-400">
                @{poll.creator.username} · {timeAgo(poll.createdAt)}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {categoryEmoji} {poll.category}
            </span>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                aria-label="Delete poll"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Question */}
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{poll.question}</h1>

        {/* Options */}
        <div className="space-y-2.5">
          {poll.options.map((option) => (
            <PollOption
              key={option.id}
              id={option.id}
              text={option.optionText}
              voteCount={option.voteCount}
              totalVotes={poll.totalVotes}
              selected={selectedOptionId === option.id}
              isVoted={hasVoted}
              isWinning={hasVoted && option.voteCount === maxVotes && maxVotes > 0}
              onSelect={setSelectedOptionId}
              disabled={voting || hasVoted}
            />
          ))}
        </div>

        {/* Vote button */}
        {!hasVoted &&
          (user ? (
            <Button
              onClick={handleVote}
              loading={voting}
              disabled={!selectedOptionId}
              className="w-full"
            >
              Vote
            </Button>
          ) : (
            <p className="text-sm text-center text-gray-400">
              <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to vote
            </p>
          ))}

        {/* Footer stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span>{formatNumber(poll.totalVotes)} votes</span>
            <span>{formatNumber(poll.commentCount)} comments</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-primary-600 transition-colors"
            aria-label="Share poll"
          >
            <Share2 size={15} />
            Share
          </button>
        </div>
      </article>

      {/* Comments */}
      <div className="card p-6">
        <CommentList pollId={poll.id} />
      </div>
    </div>
  );
}
