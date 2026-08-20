'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Edit3, BarChart2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usersApi, UserProfile, UserPollSummary } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/user/UserAvatar';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { timeAgo, formatNumber } from '@/lib/utils';
import { CATEGORY_EMOJIS } from '@/lib/constants';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [polls, setPolls] = useState<UserPollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ username: '', displayName: '', bio: '' });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = authUser?.username === username;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await usersApi.get(username);
        setProfile(data.user);
        setPolls(data.polls);
        setEditData({
          username: data.user.username,
          displayName: data.user.displayName,
          bio: data.user.bio || '',
        });
      } catch (err: any) {
        setError(err.message || 'User not found.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await usersApi.updateMe({
        username: editData.username,
        displayName: editData.displayName,
        bio: editData.bio,
      });
      await refreshUser();
      const data = await usersApi.get(editData.username);
      setProfile(data.user);
      setEditOpen(false);
      toast.success('Profile updated!');
      // Navigate to new username if changed
      if (editData.username !== username) {
        window.location.href = `/profile/${editData.username}`;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading profile..." />;
  if (error || !profile) return <ErrorState message={error || 'User not found.'} />;

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <UserAvatar avatarUrl={profile.avatarUrl} username={profile.username} size="xl" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{profile.displayName}</h1>
              <p className="text-gray-400 text-sm">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="flex-shrink-0"
            >
              <Edit3 size={14} className="mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-5 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{formatNumber(profile.pollCount)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Polls</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{formatNumber(profile.votesReceived)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Votes received</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mt-5">Joined {timeAgo(profile.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* User's polls */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3">
          {isOwnProfile ? 'Your Polls' : `${profile.displayName}'s Polls`}
        </h2>

        {polls.length === 0 ? (
          <EmptyState
            title="No polls yet."
            description={isOwnProfile ? 'Create your first poll!' : `${profile.displayName} hasn't created any polls yet.`}
            icon="🗳️"
            action={
              isOwnProfile ? (
                <Link href="/create">
                  <Button>Create a Poll</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {polls.map((poll) => (
              <Link key={poll.id} href={`/poll/${poll.id}`} className="block">
                <div className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
                        {poll.question}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(poll.createdAt)}</p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {CATEGORY_EMOJIS[poll.category]} {poll.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BarChart2 size={12} />
                      {formatNumber(poll.voteCount)} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {formatNumber(poll.commentCount)} comments
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Display Name"
            value={editData.displayName}
            onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
            maxLength={100}
            required
          />
          <Input
            label="Username"
            value={editData.username}
            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            hint="Letters, numbers, and underscores only."
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Tell people a little about yourself..."
              maxLength={200}
              rows={3}
              className="textarea"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{editData.bio.length}/200</p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
