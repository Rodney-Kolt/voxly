'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Share2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PollWithDetails, pollsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { timeAgo, formatNumber } from '@/lib/utils';
import { CATEGORY_EMOJIS } from '@/lib/constants';
import { UserAvatar } from '@/components/user/UserAvatar';
import { PollOption } from './PollOption';
import { Button } from '@/components/ui/Button';

interface PollCardProps {
  poll: PollWithDetails;
  onUpdate?: (updated: PollWithDetails) => void;
  showLink?: boolean;
}

export function PollCard({ poll: initialPoll, onUpdate, showLink = true }: PollCardProps) {
  const { user } = useAuth();
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    poll.userVotedOptionId
  );
  const [voting, setVoting] = useState(false);

  const hasVoted = poll.userVotedOptionId !== null;

  // Determine the winning option(s) for display
  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount));

  const handleVote = async () => {
    if (!user) {
      toast.error('Sign in to vote!');
      return;
    }
    if (!selectedOptionId || hasVoted || voting) return;

    setVoting(true);
    try {
      const data = await pollsApi.vote(poll.id, selectedOptionId);
      setPoll(data.poll);
      onUpdate?.(data.poll);
      toast.success('Vote recorded! 🗳️');
    } catch (err: any) {
      if (err.code === 'ALREADY_VOTED') {
        toast.error('You already voted on this poll.');
      } else {
        toast.error('Failed to vote. Try again.');
      }
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/poll/${poll.id}`;
    if (navigator.share) {
      await navigator.share({ title: poll.question, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const categoryEmoji = CATEGORY_EMOJIS[poll.category] || '💬';

  return (
    <article className="card p-5 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <Link
          href={`/profile/${poll.creator.username}`}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <UserAvatar
            avatarUrl={poll.creator.avatarUrl}
            username={poll.creator.username}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
              {poll.creator.displayName}
            </p>
            <p className="text-xs text-gray-400">
              @{poll.creator.username} · {timeAgo(poll.createdAt)}
            </p>
          </div>
        </Link>
        <span className="flex-shrink-0 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          {categoryEmoji} {poll.category}
        </span>
      </div>

      {/* Question */}
      {showLink ? (
        <Link href={`/poll/${poll.id}`}>
          <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug hover:text-primary-700 transition-colors">
            {poll.question}
          </h3>
        </Link>
      ) : (
        <h3 className="text-base font-bold text-gray-900 mb-4 leading-snug">{poll.question}</h3>
      )}

      {/* Options */}
      <div className="flex flex-col gap-2.5 mb-4">
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
      {!hasVoted && user && (
        <Button
          onClick={handleVote}
          loading={voting}
          disabled={!selectedOptionId || voting}
          className="w-full mb-4"
        >
          Vote
        </Button>
      )}

      {!hasVoted && !user && (
        <p className="text-xs text-center text-gray-400 mb-4">
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>{' '}
          to vote
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <BarChart2 size={15} />
            <span className="font-medium">{formatNumber(poll.totalVotes)} votes</span>
          </span>
          <Link
            href={`/poll/${poll.id}#comments`}
            className="flex items-center gap-1.5 hover:text-primary-500 transition-colors"
          >
            <MessageCircle size={15} />
            <span className="font-medium">{formatNumber(poll.commentCount)}</span>
          </Link>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-primary-500 transition-colors p-1"
          aria-label="Share poll"
        >
          <Share2 size={15} />
          <span className="text-xs font-medium">Share</span>
        </button>
      </div>
    </article>
  );
}
