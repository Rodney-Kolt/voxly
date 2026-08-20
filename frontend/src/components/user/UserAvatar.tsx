import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils';

interface UserAvatarProps {
  avatarUrl: string | null;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: { px: 24, cls: 'w-6 h-6 text-xs' },
  sm: { px: 32, cls: 'w-8 h-8 text-sm' },
  md: { px: 40, cls: 'w-10 h-10 text-base' },
  lg: { px: 56, cls: 'w-14 h-14 text-lg' },
  xl: { px: 80, cls: 'w-20 h-20 text-xl' },
};

export function UserAvatar({ avatarUrl, username, size = 'md', className = '' }: UserAvatarProps) {
  const { px, cls } = sizes[size];
  const src = getAvatarUrl(avatarUrl, username);

  return (
    <div className={`${cls} rounded-full overflow-hidden bg-primary-100 flex-shrink-0 ${className}`}>
      <Image
        src={src}
        alt={`${username}'s avatar`}
        width={px}
        height={px}
        className="w-full h-full object-cover"
        unoptimized={src.includes('dicebear')}
      />
    </div>
  );
}
