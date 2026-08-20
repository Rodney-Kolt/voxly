'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { commentsApi, Comment } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/user/UserAvatar';
import { CommentForm } from './CommentForm';
import { LoadingState } from '@/components/ui/LoadingState';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';

interface CommentListProps {
  pollId: string;
}

export function CommentList({ pollId }: CommentListProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await commentsApi.list(pollId);
        setComments(data.comments);
        setTotal(data.total);
      } catch {
        toast.error('Failed to load comments.');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [pollId]);

  const handleDelete = async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => t - 1);
      toast.success('Comment deleted.');
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  const handleCommentAdded = (comment: Comment) => {
    setComments((prev) => [...prev, comment]);
    setTotal((t) => t + 1);
  };

  return (
    <div id="comments" className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">
        Comments {total > 0 && <span className="text-gray-400 font-normal text-base">({total})</span>}
      </h2>

      <CommentForm pollId={pollId} onCommentAdded={handleCommentAdded} />

      {loading ? (
        <LoadingState message="Loading comments..." />
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link href={`/profile/${comment.user.username}`}>
                <UserAvatar
                  avatarUrl={comment.user.avatarUrl}
                  username={comment.user.username}
                  size="sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Link
                      href={`/profile/${comment.user.username}`}
                      className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {comment.user.displayName}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                      {user?.id === comment.user.id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
