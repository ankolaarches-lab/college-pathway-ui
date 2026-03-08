"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getFavorites, getSearchHistory } from '@/lib/supabase-client';
import {
    User,
    Award,
    History,
    Heart,
    Zap,
    Settings,
    ChevronRight,
    Star,
    Search,
    LayoutDashboard,
    ArrowRightLeft,
    MapPin,
    ArrowRight,
    BarChart3
} from 'lucide-react';

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
        <div className="max-w-7xl mx-auto px-4 py-16">
            {/* Legend Header */}
            <div className="glass-card p-10 mb-12 relative overflow-hidden group border-indigo-50/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-3xl -mr-32 -mt-32 rounded-full group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
                        <User size={48} />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                            Welcome, {profile?.display_name || user?.email?.split('@')[0]}!
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                                <User size={12} />
                                {profile?.user_mode || 'Student'}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100/50">
                                <Zap size={12} />
                                {profile?.points || 0} Points
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100/50">
                                <Award size={12} />
                                {profile?.reputation_level || 'Novice'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content (Left 2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Recent Favorites */}
                    <section>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500">
                                    <Heart size={18} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Saved Colleges</h2>
                            </div>
                            <Link href="/favorites" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                                View Full List
                            </Link>
                        </div>

                        {favorites.length === 0 ? (
                            <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 bg-transparent">
                                <p className="text-slate-400 font-medium mb-6">Your college shortlist is empty.</p>
                                <Link href="/search" className="h-12 px-8 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-100 hover:scale-105 transition-all inline-flex items-center justify-center">
                                    Start Exploring
                                </Link>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-3 gap-6">
                                {favorites.map((fav) => (
                                    <Link
                                        key={fav.id}
                                        href={`/college/${fav.institution_id}`}
                                        className="glass-card p-6 border-transparent hover:border-indigo-100 hover:shadow-indigo-50/50 transition-all group relative overflow-hidden"
                                    >
                                        <div className="relative z-10">
                                            <h3 className="font-black text-slate-800 group-hover:text-indigo-600 truncate mb-1 pr-4">
                                                {fav.institution?.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-4">
                                                <MapPin size={10} className="text-indigo-400" />
                                                {fav.institution?.city}, {fav.institution?.state}
                                            </div>
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-tighter">
                                                {fav.institution?.institution_type}
                                            </span>
                                        </div>
                                        <ChevronRight size={14} className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-200 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Recent Search History */}
                    <section>
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                                    <History size={18} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Searches</h2>
                            </div>
                            <Link href="/search-history" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-slate-400 font-medium italic ml-2">No recent searches yet.</p>
                            ) : (
                                history.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/search?q=${item.search_query || ''}`}
                                        className="flex items-center justify-between p-6 bg-white/60 rounded-3xl border border-white hover:border-indigo-100 transition-all group"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                <Search size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.search_query || 'All Institutions'}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    <span>{item.results_count} results</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-indigo-300 transition-colors">
                                            <ArrowRight size={18} />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar (Right 1 col) */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <section className="glass-card p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-xl shadow-indigo-100">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap size={20} className="text-indigo-200" />
                            <h2 className="text-lg font-black tracking-tight">Quick Actions</h2>
                        </div>
                        <div className="space-y-4">
                            <Link href="/search" className="flex items-center justify-between w-full h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 group">
                                <Search size={16} />
                                Find Colleges
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/compare" className="flex items-center justify-between w-full h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 group">
                                <LayoutDashboard size={16} />
                                Compare Tools
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/transfer-pathways" className="flex items-center justify-between w-full h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/20 group">
                                <ArrowRightLeft size={16} />
                                Transfer Hub
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </section>

                    {/* Profile Stats */}
                    <section className="glass-card p-8 border-indigo-50/50">
                        <div className="flex items-center gap-3 mb-8">
                            <BarChart3 size={20} className="text-slate-400" />
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Your Activity</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Saved Schools</span>
                                <span className="text-slate-800">{favorites.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Total Searches</span>
                                <span className="text-slate-800">{history.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Reputation</span>
                                <span className="text-indigo-600">{profile?.reputation_level || 'Novice'}</span>
                            </div>
                            <div className="pt-8 border-t border-slate-100">
                                <Link href="/" className="flex items-center justify-between group">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Settings</span>
                                    <Settings size={14} className="text-slate-300 group-hover:text-indigo-400 group-hover:rotate-45 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
