"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getFavorites, getSearchHistory } from '@/lib/supabase-client';

export default function DashboardPage() {
    const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setLoading(false);
            return;
        }

        async function loadDashboardData() {
            if (!user) return;

            const [favsRes, historyRes] = await Promise.all([
                getFavorites(user.id),
                getSearchHistory(user.id, 5)
            ]);

            if (favsRes.data) setFavorites(favsRes.data.slice(0, 3));
            if (historyRes.data) setHistory(historyRes.data);

            setLoading(false);
        }

        loadDashboardData();
    }, [user, isAuthenticated, authLoading]);

    if (authLoading || (isAuthenticated && loading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center card p-8 max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Welcome back!</h1>
                    <p className="text-slate-600 mb-6">Sign in to access your personalized college dashboard and saved schools.</p>
                    <Link href="/" className="btn-primary w-full">
                        Go to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-800">
                    Welcome, {profile?.display_name || user?.email?.split('@')[0]}!
                </h1>
                <p className="text-slate-600 mt-2">
                    You are currently browsing in <span className="font-semibold text-teal-600">{profile?.user_mode || 'student'}</span> mode.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Recent Favorites */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-xl font-bold text-slate-800">My Saved Colleges</h2>
                            <Link href="/favorites" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                                View All →
                            </Link>
                        </div>

                        {favorites.length === 0 ? (
                            <div className="card p-8 text-center bg-slate-50 border-dashed border-2">
                                <p className="text-slate-500 mb-4">You haven't saved any colleges yet.</p>
                                <Link href="/search" className="btn-primary inline-block">
                                    Start Exploring
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-4">
                                {favorites.map((fav) => (
                                    <Link
                                        key={fav.id}
                                        href={`/college/${fav.institution_id}`}
                                        className="card p-4 hover:border-teal-300 transition-all group"
                                    >
                                        <h3 className="font-bold text-slate-800 group-hover:text-teal-600 truncate mb-1">
                                            {fav.institution?.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-3">
                                            {fav.institution?.city}, {fav.institution?.state}
                                        </p>
                                        <span className="badge badge-sm">{fav.institution?.institution_type}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Recent Search History */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Recent Searches</h2>
                            <Link href="/search-history" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                                View History →
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-slate-500 italic">No recent searches.</p>
                            ) : (
                                history.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/search?q=${item.search_query || ''}`}
                                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-800">{item.search_query || 'All Institutions'}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.results_count} results found • {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar (Right 1 col) */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <section className="card p-6 bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-none">
                        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link href="/search" className="block w-full text-center py-2 bg-white text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors">
                                Find New Colleges
                            </Link>
                            <Link href="/compare" className="block w-full text-center py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/30">
                                Compare Colleges
                            </Link>
                            <Link href="/transfer-pathways" className="block w-full text-center py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/30">
                                Transfer Pathways
                            </Link>
                        </div>
                    </section>

                    {/* Profile Stats */}
                    <section className="card p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Activity</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Saved Schools</span>
                                <span className="font-bold text-slate-800">{favorites.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total Searches</span>
                                <span className="font-bold text-slate-800">{history.length}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <Link href="/" className="text-sm text-slate-500 hover:text-teal-600">
                                    Manage Profile Settings
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
