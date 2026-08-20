import { formatDistanceToNow, parseISO } from 'date-fns';

export function timeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function calcPercent(voteCount: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getAvatarUrl(avatarUrl: string | null, username: string): string {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}
