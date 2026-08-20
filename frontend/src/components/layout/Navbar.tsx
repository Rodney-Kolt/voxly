'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, PlusCircle, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
  { href: '/create', label: 'Create', icon: PlusCircle },
  { href: '/activity', label: 'Activity', icon: Bell },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    router.push('/');
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-primary-600 tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
                aria-label="User menu"
                aria-expanded={menuOpen}
              >
                <UserAvatar avatarUrl={user.avatarUrl} username={user.username} size="sm" />
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{user.displayName}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} />
                    View Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-600"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
