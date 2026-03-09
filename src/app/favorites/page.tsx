'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getFavorites, removeFavorite } from '@/lib/supabase-client';
import { Heart, MapPin, Building2, ArrowRight, Search, LayoutGrid } from 'lucide-react';

export default function FavoritesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
      return;
    }

    async function loadFavorites() {
      if (!user) return;

      const { data, error } = await getFavorites(user.id);

      if (error) {
        setError('Failed to load favorites');
      } else {
        setFavorites(data || []);
      }

      setLoading(false);
    }

    loadFavorites();
  }, [user, isAuthenticated, authLoading]);

  const handleRemoveFavorite = async (institutionId: number) => {
    if (!user) return;

    const { error } = await removeFavorite(user.id, institutionId);

    if (!error) {
      setFavorites(favorites.filter((f: any) => f.institution_id !== institutionId));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Heart size={20} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass-card p-12 text-center max-w-lg w-full border-none shadow-2xl">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Heart size={40} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your Wishlist Awaits</h1>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">Sign in to sync your favorite institutions across all your devices and keep your journey organized.</p>
          <Link href="/" className="h-14 px-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all mx-auto w-fit">
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 px-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-full flex items-center text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {favorites.length} SAVED COLLEGES
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">My Favorites</h1>
            <p className="text-slate-500 font-medium text-lg">Curating your path to academic excellence.</p>
          </div>

          <Link href="/search" className="h-12 px-6 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center gap-2 font-bold text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
            <Search size={16} />
            Explore More
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-6 border-red-100 bg-red-50/50 text-red-600 font-bold text-center mx-4">{error}</div>
        ) : favorites.length === 0 ? (
          <div className="glass-card p-20 text-center mx-4 border-none shadow-xl shadow-slate-100/50">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <LayoutGrid size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your gallery is empty</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed font-medium">Start exploring institutions and save them to your personal collection for side-by-side comparison.</p>
            <Link href="/search" className="h-14 px-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all mx-auto w-fit">
              <Search size={18} />
              Start Searching
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {favorites.map((favorite: any) => (
              <div key={favorite.id} className="glass-card-elevated p-8 relative group hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 border-none">
                <button
                  onClick={() => handleRemoveFavorite(favorite.institution_id)}
                  className="absolute top-8 right-8 w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 hover:scale-110 transition-all shadow-sm z-10"
                  title="Remove from favorites"
                >
                  <Heart size={18} fill="currentColor" className="text-red-500" />
                </button>

                <Link href={`/college/${favorite.institution_id}`} className="block h-full">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Building2 size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-3 pr-10 group-hover:text-indigo-600 transition-colors">
                      {favorite.institution?.name}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                      <MapPin size={14} className="text-slate-400" />
                      {favorite.institution?.city}, {favorite.institution?.state}
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                    <span className="h-8 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center">
                      {favorite.institution?.institution_type || 'Unknown'}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
