"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getFavorites, removeFavorite } from '@/lib/supabase-client';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Sign in to view favorites</h1>
          <p className="text-slate-600 mb-6">Create an account to save your favorite colleges</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Favorites</h1>
        <p className="text-slate-600 mt-1">Colleges you've saved for later</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No favorites yet</h2>
          <p className="text-slate-600 mb-6">Start exploring colleges and save your favorites</p>
          <Link href="/search" className="btn-primary">
            Search Colleges
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite: any) => (
            <div key={favorite.id} className="card p-6 relative">
              <button
                onClick={() => handleRemoveFavorite(favorite.institution_id)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove from favorites"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              <Link href={`/college/${favorite.institution_id}`} className="block">
                <h3 className="text-lg font-semibold text-slate-800 mb-1 pr-8">
                  {favorite.institution?.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  {favorite.institution?.city}, {favorite.institution?.state}
                </p>
                <span className="badge badge-secondary">
                  {favorite.institution?.institution_type || 'Unknown'}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
