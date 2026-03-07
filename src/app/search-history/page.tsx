"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getSearchHistory, clearSearchHistory } from '@/lib/supabase-client';

export default function SearchHistoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLoading(false);
      return;
    }

    async function loadHistory() {
      if (!user) return;
      
      const { data, error } = await getSearchHistory(user.id);
      
      if (error) {
        setError('Failed to load search history');
      } else {
        setHistory(data || []);
      }
      
      setLoading(false);
    }

    loadHistory();
  }, [user, isAuthenticated, authLoading]);

  const handleClearHistory = async () => {
    if (!user) return;
    
    const { error } = await clearSearchHistory(user.id);
    
    if (!error) {
      setHistory([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const buildSearchUrl = (searchQuery: string, filters: any) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.state) params.set('state', filters.state);
    if (filters?.max_tuition) params.set('max_tuition', filters.max_tuition);
    return `/search?${params.toString()}`;
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
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Sign in to view search history</h1>
          <p className="text-slate-600 mb-6">Create an account to track your college searches</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Search History</h1>
          <p className="text-slate-600 mt-1">Your recent college searches</p>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No search history</h2>
          <p className="text-slate-600 mb-6">Your recent searches will appear here</p>
          <Link href="/search" className="btn-primary">
            Search Colleges
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item: any) => (
            <Link
              key={item.id}
              href={buildSearchUrl(item.search_query, item.filters)}
              className="card p-4 flex items-center justify-between hover:border-teal-300 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {item.search_query || 'All colleges'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-500">
                    {item.results_count} results
                  </span>
                  {item.filters?.type && (
                    <span className="badge badge-sm">{item.filters.type}</span>
                  )}
                  {item.filters?.state && (
                    <span className="badge badge-sm">{item.filters.state}</span>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-400">
                {formatDate(item.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
