"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getSearchHistory, clearSearchHistory } from '@/lib/supabase-client';
import { History, Search, Trash2, Calendar, ArrowUpRight, Clock, Filter, LayoutGrid } from 'lucide-react';

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

    if (!confirm('Are you sure you want to clear your entire search history?')) return;

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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
            <History size={20} className="animate-pulse" />
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
            <History size={40} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your Search Journey</h1>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">Sign in to keep track of your previous searches and pick up exactly where you left off.</p>
          <Link href="/" className="h-14 px-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all mx-auto w-fit">
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 px-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-full flex items-center text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {history.length} SEARCH SESSIONS
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Recent activity</h1>
            <p className="text-slate-500 font-medium text-lg">Retrace your steps through the academic landscape.</p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="h-12 px-6 bg-white border border-red-100 text-red-600 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-red-50 transition-all shadow-sm"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-6 border-red-100 bg-red-50/50 text-red-600 font-bold text-center mx-4">{error}</div>
        ) : history.length === 0 ? (
          <div className="glass-card p-20 text-center mx-4 border-none shadow-xl shadow-slate-100/50">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Search size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No history found</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed font-medium">Your search history is currently empty. Start exploring colleges to see your journey here.</p>
            <Link href="/search" className="h-14 px-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all mx-auto w-fit">
              <Search size={18} />
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {history.map((item: any) => (
              <Link
                key={item.id}
                href={buildSearchUrl(item.search_query, item.filters)}
                className="glass-card p-6 flex items-center justify-between hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/30 transition-all group border-white/80"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <Search size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                      {item.search_query || 'Global Search'}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <LayoutGrid size={12} />
                        {item.results_count} Results
                      </span>
                      {item.filters?.type && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-slate-200 flex items-center gap-1">
                          <Filter size={10} />
                          {item.filters.type}
                        </span>
                      )}
                      {item.filters?.state && (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                          {item.filters.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-6">
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Accessed</p>
                    <span className="text-sm font-bold text-slate-700 flex items-center justify-end gap-2">
                      <Clock size={14} className="text-slate-300" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
