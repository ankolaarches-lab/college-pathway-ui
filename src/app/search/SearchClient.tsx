"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addSearchHistory, addFavorite, removeFavorite, getFavorites } from "@/lib/supabase-client";
import {
    Search,
    Filter,
    MapPin,
    DollarSign,
    GraduationCap,
    Building2,
    Heart,
    BarChart3,
    RotateCcw,
    ArrowRight,
    TrendingUp,
    Award
} from 'lucide-react';

interface College {
    id: number;
    name: string;
    city: string;
    state: string;
    type: string;
    tuition: number | null;
    admission_rate: number | null;
    graduation_rate: number | null;
    median_earnings: number | null;
}

function SearchPageContent({
    searchParams
}: {
    searchParams: ReturnType<typeof useSearchParams>;
}) {
    const RESULTS_PER_PAGE = 24;

    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [compareList, setCompareList] = useState<number[]>([]);
    const [userFavorites, setUserFavorites] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        type: "",
        minCost: 0,
        maxCost: 70000,
        admissionRate: 100,
        zipCode: "",
        distance: 50,
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { user, isAuthenticated } = useAuth();

    const searchType = searchParams.get('type');
    const searchMaxTuition = searchParams.get('max_tuition');
    const searchState = searchParams.get('state');
    const searchQuery = searchParams.get('q');

    useEffect(() => {
        async function loadFavorites() {
            if (user) {
                const { data } = await getFavorites(user.id);
                if (data) {
                    setUserFavorites(data.map((fav: any) => fav.institution_id));
                }
            }
        }
        loadFavorites();
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setCurrentPage(1); // Reset to page 1 on filter change
        }, 1000);

        return () => clearTimeout(timer);
    }, [filters]);

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            type: searchType || '',
            maxCost: searchMaxTuition ? parseInt(searchMaxTuition) : 70000,
        }));
    }, [searchType, searchMaxTuition]);

    useEffect(() => {
        async function fetchColleges() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (debouncedFilters.type) params.set('type', debouncedFilters.type);
                if (debouncedFilters.maxCost < 70000) params.set('max_tuition', debouncedFilters.maxCost.toString());
                if (debouncedFilters.zipCode && debouncedFilters.zipCode.length === 5) {
                    params.set('zip', debouncedFilters.zipCode);
                    params.set('distance', debouncedFilters.distance.toString());
                }
                params.set('limit', RESULTS_PER_PAGE.toString());
                params.set('offset', ((currentPage - 1) * RESULTS_PER_PAGE).toString());

                const response = await fetch(`/api/colleges?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch colleges');
                }
                const data = await response.json();
                setColleges(Array.isArray(data.colleges) ? data.colleges : []);
                setTotalCount(data.total || 0);

                if (isAuthenticated && user) {
                    await addSearchHistory(
                        user.id,
                        searchQuery || '',
                        { type: debouncedFilters.type, state: searchState, max_tuition: debouncedFilters.maxCost },
                        data.total || 0
                    );
                }
            } catch (err) {
                console.error('Error fetching colleges:', err);
                setError('Failed to load colleges. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchColleges();
    }, [debouncedFilters, currentPage, searchState, searchQuery, isAuthenticated, user]);

    const toggleCompare = (id: number) => {
        if (compareList.includes(id)) {
            setCompareList(compareList.filter((c) => c !== id));
        } else if (compareList.length < 5) {
            setCompareList([...compareList, id]);
        }
    };

    const toggleFavorite = async (id: number) => {
        if (!user) return;

        if (userFavorites.includes(id)) {
            const { error } = await removeFavorite(user.id, id);
            if (!error) {
                setUserFavorites(userFavorites.filter(favId => favId !== id));
            }
        } else {
            const { error } = await addFavorite(user.id, id);
            if (!error) {
                setUserFavorites([...userFavorites, id]);
            }
        }
    };

    // Note: type filtering is handled server-side (with pagination).
    // Only apply client-side filters for things the API doesn't handle: minCost and admissionRate.
    const filteredColleges = (colleges || []).filter((college) => {
        if (college.tuition && (college.tuition > filters.maxCost || college.tuition < filters.minCost)) return false;
        if (college.admission_rate && college.admission_rate > filters.admissionRate) return false;
        return true;
    });

    const formatTuition = (tuition: number | null) => {
        if (tuition === null) return 'N/A';
        return `$${tuition.toLocaleString()}`;
    };

    const formatRate = (rate: number | null | undefined) => {
        if (rate === null || rate === undefined) return 'N/A';
        return `${rate.toFixed(1)}%`;
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="w-full h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-between px-6 font-black text-slate-700 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <Filter size={20} className="text-indigo-600" />
                            <span>Filter Results</span>
                        </div>
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px]">
                            {Object.values(filters).filter(v => v !== "" && v !== 0 && v !== 70000 && v !== 100 && v !== 50).length} active
                        </span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter Sidebar - Desktop & Mobile Overlay */}
                    <aside className={`
                        lg:w-80 flex-shrink-0 
                        ${isFilterOpen ? 'fixed inset-0 z-[60] p-6 bg-slate-900/40 backdrop-blur-sm lg:relative lg:bg-transparent lg:p-0' : 'hidden lg:block'}
                    `}>
                        <div className={`
                            glass-card p-8 sticky top-24 border-indigo-50/50
                            ${isFilterOpen ? 'max-h-[90vh] overflow-y-auto animate-fadeInUp' : ''}
                        `}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Filter size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Filters</h2>
                                </div>
                                {isFilterOpen && (
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"
                                    >
                                        <ArrowRight size={20} className="rotate-180" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Location</label>
                                    <input
                                        type="text"
                                        placeholder="ZIP Code (e.g. 90210)"
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                        value={filters.zipCode}
                                        onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
                                        maxLength={5}
                                    />

                                    {filters.zipCode.length === 5 && (
                                        <div className="mt-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-50/50">
                                            <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                                                Distance: {filters.distance} miles
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="500"
                                                step="10"
                                                value={filters.distance}
                                                onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-[10px] font-bold text-indigo-300 mt-2">
                                                <span>10mi</span>
                                                <span>500mi</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">College Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Public', 'Private', '4-Year', '2-Year'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setFilters({ ...filters, type: filters.type === type.toLowerCase() ? "" : type.toLowerCase() })}
                                                className={`h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filters.type === type.toLowerCase()
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Tuition</label>
                                        <span className="text-sm font-black text-slate-700">${(filters.maxCost / 1000).toFixed(0)}k<span className="text-[10px] text-slate-400 ml-0.5">/yr</span></span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="70000"
                                        step="1000"
                                        value={filters.maxCost}
                                        onChange={(e) => setFilters({ ...filters, maxCost: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-2">
                                        <span>$0</span>
                                        <span>$70k+</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inclusivity</label>
                                        <span className="text-sm font-black text-slate-700">{filters.admissionRate}%<span className="text-[10px] text-slate-400 ml-0.5">adm</span></span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={filters.admissionRate}
                                        onChange={(e) => setFilters({ ...filters, admissionRate: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-2">
                                        <span>1%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-100 space-y-3">
                                <button
                                    onClick={() => setFilters({ type: "", minCost: 0, maxCost: 70000, admissionRate: 100, zipCode: "", distance: 50 })}
                                    className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-slate-400 hover:text-slate-600 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    <RotateCcw size={14} />
                                    Reset Filters
                                </button>
                                {isFilterOpen && (
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100"
                                    >
                                        Show Results
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Search Results</h1>
                            </div>
                            {loading ? (
                                <div className="flex items-center gap-2 text-slate-400 font-medium ml-5">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse"></div>
                                    Loading colleges...
                                </div>
                            ) : error ? (
                                <p className="text-red-500 ml-5">{error}</p>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-400 font-medium ml-5">
                                    <span className="text-indigo-600 font-bold">{totalCount}</span> colleges found
                                    {totalCount > 0 && <span className="text-slate-300">· page {currentPage} of {Math.ceil(totalCount / RESULTS_PER_PAGE)}</span>}
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                            </div>
                        ) : error ? (
                            <div className="card p-8 text-center">
                                <p className="text-red-500">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="btn-primary mt-4"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredColleges && filteredColleges.length > 0 ? (
                                        filteredColleges.map((college, index) => (
                                            <div
                                                key={college.id}
                                                className="glass-card p-8 group hover:border-indigo-200 transition-all duration-500 animate-fadeInUp"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex-1">
                                                        <Link href={`/college/${college.id}`} className="text-xl font-black text-slate-800 hover:text-indigo-600 transition-colors block mb-1 tracking-tight">
                                                            {college.name}
                                                        </Link>
                                                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                            <MapPin size={12} className="text-indigo-400" />
                                                            {college.city}, {college.state}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {isAuthenticated && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    toggleFavorite(college.id);
                                                                }}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userFavorites.includes(college.id) ? 'bg-red-50 text-red-500 shadow-sm shadow-red-100' : 'bg-slate-50 text-slate-300 hover:text-red-400 hover:bg-red-50'}`}
                                                                title={userFavorites.includes(college.id) ? "Remove from favorites" : "Add to favorites"}
                                                            >
                                                                <Heart size={20} fill={userFavorites.includes(college.id) ? "currentColor" : "none"} />
                                                            </button>
                                                        )}
                                                        <div className="relative group/check">
                                                            <input
                                                                type="checkbox"
                                                                checked={compareList.includes(college.id)}
                                                                onChange={() => toggleCompare(college.id)}
                                                                className="w-10 h-10 rounded-xl border-2 border-slate-100 checked:bg-indigo-600 checked:border-indigo-600 transition-all appearance-none cursor-pointer"
                                                                title="Add to compare"
                                                            />
                                                            <BarChart3 size={18} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors ${compareList.includes(college.id) ? 'text-white' : 'text-slate-300'}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                                                        {college.type}
                                                    </span>
                                                    {college.graduation_rate && college.graduation_rate > 0.7 && (
                                                        <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100/50 flex items-center gap-1">
                                                            <TrendingUp size={10} />
                                                            High Grad Rate
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Est. Tuition</span>
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign size={14} className="text-slate-400" />
                                                            <p className="font-black text-slate-800">{formatTuition(college.tuition)}</p>
                                                            <span className="text-[10px] text-slate-400 font-bold">/yr</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Success Rate</span>
                                                        <div className="flex items-center gap-1">
                                                            <Award size={14} className="text-teal-500" />
                                                            <p className="font-black text-teal-600">{formatRate(college.graduation_rate)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link href={`/college/${college.id}`} className="mt-6 w-full h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-2 font-black text-slate-600 text-sm hover:bg-slate-50 hover:border-indigo-100 transition-all group/btn">
                                                    View Profile
                                                    <ArrowRight size={16} className="text-slate-300 group-hover/btn:translate-x-1 transition-transform group-hover/btn:text-indigo-400" />
                                                </Link>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-12 text-center text-slate-500">
                                            No colleges match your filters.
                                        </div>
                                    )}
                                </div>

                                {totalCount > RESULTS_PER_PAGE && (
                                    <div className="mt-12 flex justify-center">
                                        <div className="flex gap-3 flex-wrap justify-center">
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={currentPage === 1}
                                                className="h-12 px-6 rounded-2xl border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.ceil(totalCount / RESULTS_PER_PAGE) }, (_, i) => i + 1)
                                                .filter(p => p === 1 || p === Math.ceil(totalCount / RESULTS_PER_PAGE) || Math.abs(p - currentPage) <= 1)
                                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                                                    acc.push(p);
                                                    return acc;
                                                }, [])
                                                .map((p, i) => p === '...' ? (
                                                    <span key={`ellipsis-${i}`} className="w-12 h-12 flex items-center justify-center text-slate-400 font-black">…</span>
                                                ) : (
                                                    <button
                                                        key={p}
                                                        onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${currentPage === p
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))
                                            }
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.min(Math.ceil(totalCount / RESULTS_PER_PAGE), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={currentPage === Math.ceil(totalCount / RESULTS_PER_PAGE)}
                                                className="h-12 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {compareList.length > 0 && (
                <div className="fixed bottom-10 right-10 z-50">
                    <Link
                        href={`/compare?colleges=${compareList.join(",")}`}
                        className="h-16 px-8 rounded-3xl bg-indigo-600 text-white font-black flex items-center gap-3 shadow-2xl shadow-indigo-100 hover:scale-105 transition-all group"
                    >
                        <BarChart3 size={20} className="group-hover:rotate-12 transition-transform" />
                        Compare Colleges
                        <span className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center text-[10px] font-black">
                            {compareList.length}
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function SearchPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading search results...</p>
                </div>
            </div>
        }>
            <SearchPageContentLoader />
        </Suspense>
    );
}

function SearchPageContentLoader() {
    const searchParams = useSearchParams();
    return <SearchPageContent searchParams={searchParams} />;
}
