'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthModal from './AuthModal';
import { Menu, X, User, Zap, Award, LogOut, Heart, History, Search, RefreshCcw, ChevronDown, GraduationCap } from 'lucide-react';

export default function Header() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, isAuthenticated, logout, updateProfile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  const handleModeToggle = async () => {
    const newMode = profile?.user_mode === 'student' ? 'parent' : 'student';
    await updateProfile({ user_mode: newMode });
  };

  const navLinks = [
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Transfer', href: '/transfer-pathways', icon: RefreshCcw, soon: true },
  ];

  const userLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: User },
    { name: 'My Favorites', href: '/favorites', icon: Heart },
    { name: 'Search History', href: '/search-history', icon: History },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'py-3 bg-white/80 backdrop-blur-xl shadow-lg border-b border-white'
          : 'py-6 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-100 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className={`text-xl font-black tracking-tighter ${scrolled ? 'text-slate-900' : 'text-slate-900'} hidden xs:block`}>
              College<span className="text-indigo-600">Path</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:text-indigo-600 ${scrolled ? 'text-slate-600' : 'text-slate-500'
                  }`}
              >
                {link.name}
                {link.soon && (
                  <span className="h-4 px-1.5 bg-indigo-100 text-indigo-500 rounded text-[8px] font-black uppercase tracking-widest leading-none flex items-center">
                    Soon
                  </span>
                )}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`text-xs font-black uppercase tracking-widest transition-all hover:text-indigo-600 ${scrolled ? 'text-slate-600' : 'text-slate-500'
                  }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Auth/User Actions */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                {/* Mode Toggle - Desktop */}
                <button
                  onClick={handleModeToggle}
                  className="hidden md:flex items-center gap-2 h-10 px-4 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-indigo-100 hover:text-indigo-600 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {profile?.user_mode === 'student' ? 'Student' : 'Parent'}
                </button>

                {/* User Dropdown - Desktop */}
                <div className="relative group hidden md:block">
                  <button className="flex items-center gap-3 h-12 pl-2 pr-4 bg-white border border-slate-100 rounded-3xl shadow-sm group-hover:border-indigo-100 transition-all">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                      {profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-indigo-500 transition-all" />
                  </button>

                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                      <p className="font-black text-slate-900 tracking-tight truncate mb-1">
                        {profile?.display_name || 'My Account'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.email}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Points</span>
                          <span className="text-xs font-black text-indigo-600">{profile?.points || 0}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Rank</span>
                          <span className="text-xs font-black text-slate-700">{profile?.reputation_level || 'Novice'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {userLinks.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all"
                        >
                          <link.icon size={16} />
                          <span className="text-[11px] font-black uppercase tracking-wider">{link.name}</span>
                        </Link>
                      ))}
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                      >
                        <LogOut size={16} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={handleSignupClick}
                  className="h-12 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100 hover:scale-105 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 lg:hidden shadow-sm hover:border-indigo-100 transition-all"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className={`absolute top-0 right-0 bottom-0 w-[320px] bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col p-8 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between mb-12">
              <span className="text-xl font-black tracking-tighter text-slate-900">
                College<span className="text-indigo-600">Path</span>
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 ml-2">Navigation</p>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <link.icon size={18} />
                  </div>
                  <span className="font-black text-sm text-slate-700 group-hover:text-indigo-600">{link.name}</span>
                  {link.soon && (
                    <span className="h-4 px-1.5 bg-indigo-100 text-indigo-500 rounded text-[8px] font-black uppercase tracking-widest leading-none flex items-center ml-auto">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="mt-12 space-y-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 ml-2">Your Space</p>
                {userLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <link.icon size={18} />
                    </div>
                    <span className="font-black text-sm text-slate-700 group-hover:text-indigo-600">{link.name}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-red-50 transition-all group mt-8"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-300 group-hover:text-red-500 transition-all">
                    <LogOut size={18} />
                  </div>
                  <span className="font-black text-sm text-slate-700 group-hover:text-red-600">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="mt-auto space-y-4">
                <button
                  onClick={handleSignupClick}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under the fixed header */}
      <div className="h-[96px]" />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
