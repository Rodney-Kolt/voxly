'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, PlusCircle, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  special?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/create', label: 'Create', icon: PlusCircle, special: true },
    { href: '/activity', label: 'Activity', icon: Bell },
    {
      href: user ? `/profile/${user.username}` : '/login',
      label: 'Profile',
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // For profile link — match /profile/* regardless of username
    if (href.startsWith('/profile/')) return pathname.startsWith('/profile/');
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon, special }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {special ? (
                <span className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 -mt-5">
                  <Icon size={22} className="text-white" />
                </span>
              ) : (
                <>
                  <Icon
                    size={22}
                    className={clsx(
                      'transition-colors',
                      active ? 'text-primary-600' : 'text-gray-400'
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={clsx(
                      'text-[10px] font-medium transition-colors',
                      active ? 'text-primary-600' : 'text-gray-400'
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
