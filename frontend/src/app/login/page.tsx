'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { LoadingState } from '@/components/ui/LoadingState';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      toast.error('No credential received from Google.');
      return;
    }
    setSigningIn(true);
    try {
      await login(credentialResponse.credential);
      toast.success('Welcome to Voxly! 🎉');
      router.replace('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg shadow-primary-200 mb-4">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500 mt-1.5">Your voice. The world&apos;s opinion.</p>
        </div>

        {/* Sign-in card */}
        <div className="card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
            <p className="text-sm text-gray-400 mt-1">
              Sign in to vote, create polls, and join conversations.
            </p>
          </div>

          <div className="flex justify-center">
            {signingIn ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <svg className="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing you in...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => toast.error('Google login failed.')}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="280"
              />
            )}
          </div>

          <p className="text-xs text-center text-gray-400 leading-relaxed">
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { emoji: '🗳️', label: 'Vote on polls' },
            { emoji: '✍️', label: 'Create polls' },
            { emoji: '🔥', label: 'See trending' },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
