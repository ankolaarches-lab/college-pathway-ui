"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthModal from './AuthModal';

export default function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const { user, profile, isAuthenticated, logout, updateProfile } = useAuth();

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleModeToggle = async () => {
    const newMode = profile?.user_mode === 'student' ? 'parent' : 'student';
    await updateProfile({ user_mode: newMode });
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg style={{ width: '24px', height: '24px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 hidden sm:block">CollegePath</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Search
            </Link>
            <Link href="/transfer-pathways" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Transfer
            </Link>

            {isAuthenticated && (
              <Link href="/favorites" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
                Favorites
              </Link>
            )}
          </nav>

          {/* Auth buttons / User menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Mode Toggle */}
                <button
                  onClick={handleModeToggle}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${profile?.user_mode === 'student'
                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                >
                  {profile?.user_mode === 'student' ? '🎓 Student' : '👨‍👩‍👧 Parent'}
                </button>

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-slate-600 font-medium">
                        {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-3 border-b border-slate-100">
                      <p className="font-medium text-slate-800 truncate">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/favorites"
                        className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md"
                      >
                        My Favorites
                      </Link>
                      <Link
                        href="/search-history"
                        className="block px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md"
                      >
                        Search History
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-slate-600 hover:text-teal-600 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignupClick}
                  className="btn-primary"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
