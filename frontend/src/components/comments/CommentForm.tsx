'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { commentsApi, Comment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/user/UserAvatar';
import Link from 'next/link';

interface CommentFormProps {
  pollId: string;
  onCommentAdded: (comment: Comment) => void;
}

export function CommentForm({ pollId, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-2xl">💬</span>
        <p className="text-sm text-gray-500">
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>{' '}
          to join the conversation.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const data = await commentsApi.create(pollId, content.trim());
      onCommentAdded(data.comment);
      setContent('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <UserAvatar avatarUrl={user.avatarUrl} username={user.username} size="sm" />
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          rows={2}
          maxLength={500}
          className="textarea pr-12 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="absolute right-3 bottom-3 p-1.5 text-primary-600 hover:text-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Post comment"
        >
          <Send size={16} className={submitting ? 'animate-pulse' : ''} />
        </button>
      </div>
    </form>
  );
}
