import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Search Colleges",
  description: "Find and filter colleges by type, tuition, admission rates, and location. Discover your perfect educational path with our comprehensive search tools."
});

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
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<number[]>([]);
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    minCost: 0,
    maxCost: 70000,
    admissionRate: 100,
    zipCode: "",
    distance: 50,
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const { user, isAuthenticated } = useAuth();

  // Extract search params into stable values
  const searchType = searchParams.get('type');
  const searchMaxTuition = searchParams.get('max_tuition');
  const searchState = searchParams.get('state');
  const searchQuery = searchParams.get('q');

  // Load user favorites
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

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 1000);

    return () => clearTimeout(timer);
  }, [filters]);

  // Initialize filters from URL params - only run once on mount
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      type: searchType || '',
      maxCost: searchMaxTuition ? parseInt(searchMaxTuition) : 70000,
    }));
  }, []); // Only run on mount

  // Fetch colleges from API
  useEffect(() => {
    async function fetchColleges() {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        if (debouncedFilters.type) params.set('type', debouncedFilters.type);
        if (debouncedFilters.maxCost < 70000) params.set('max_tuition', debouncedFilters.maxCost.toString());
        if (debouncedFilters.zipCode && debouncedFilters.zipCode.length === 5) {
          params.set('zip', debouncedFilters.zipCode);
          params.set('distance', debouncedFilters.distance.toString());
        }

        const response = await fetch(`/api/colleges?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(Array.isArray(data.colleges) ? data.colleges : []);

        // Save search history if user is logged in
        if (isAuthenticated && user) {
          await addSearchHistory(
            user.id,
            searchQuery || '',
            { type: debouncedFilters.type, state: searchState, max_tuition: debouncedFilters.maxCost },
            Array.isArray(data.colleges) ? data.colleges.length : 0
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
  }, [debouncedFilters, searchState, searchQuery]);

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

  const filteredColleges = (colleges || []).filter((college) => {
    if (filters.type && !college.type.toLowerCase().includes(filters.type.toLowerCase())) return false;
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="glass-card p-8 sticky top-24 border-indigo-50/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Filter size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Filters</h2>
              </div>

              {/* Location / Radius Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  placeholder="e.g. 90210"
                  className="input-field mb-3"
                  value={filters.zipCode}
                  onChange={(e) => setFilters({ ...filters, zipCode: e.target.value })}
                  maxLength={5}
                />

                {filters.zipCode.length === 5 && (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Distance: Within {filters.distance} miles
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={filters.distance}
                      onChange={(e) => setFilters({ ...filters, distance: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>10 mi</span>
                      <span>500 mi</span>
                    </div>
                  </>
                )}
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">College Type</label>
                <select
                  className="input-field"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="2-year">2-Year</option>
                  <option value="4-year">4-Year</option>
                </select>
              </div>

              {/* Cost Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Tuition: ${filters.maxCost.toLocaleString()}/year
                </label>
                <input
                  type="range"
                  min="0"
                  max="70000"
                  step="1000"
                  value={filters.maxCost}
                  onChange={(e) => setFilters({ ...filters, maxCost: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>$0</span>
                  <span>$70K</span>
                </div>
              </div>

              {/* Admission Rate */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Admission Rate: {filters.admissionRate}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.admissionRate}
                  onChange={(e) => setFilters({ ...filters, admissionRate: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1%</span>
                  <span>100%</span>
                </div>
              </div>

              <button
                onClick={() => setFilters({ type: "", minCost: 0, maxCost: 70000, admissionRate: 100, zipCode: "", distance: 50 })}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm mt-4"
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Main Content - Results */}
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
                  <span className="text-indigo-600 font-bold">{filteredColleges.length}</span> colleges found
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
                {/* Results Grid */}
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

                {/* Pagination */}
                <div className="mt-12 flex justify-center">
                  <div className="flex gap-3">
                    <button className="h-12 px-6 rounded-2xl border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                      Previous
                    </button>
                    <button className="w-12 h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">1</button>
                    <button className="w-12 h-12 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">2</button>
                    <button className="w-12 h-12 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">3</button>
                    <button className="h-12 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest flex items-center justify-center hover:bg-slate-50 transition-all">
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Compare Button */}
      {compareList.length > 0 && (
        <div className="fixed bottom-10 right-10 z-50">
          <Link
            href={`/compare?colleges=${compareList.join(",")}`}
            className="h-16 px-8 rounded-3xl bg-indigo-600 text-white font-black flex items-center gap-3 shadow-2xl shadow-indigo-200 hover:scale-105 transition-all group"
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

// Wrapper component to provide Suspense boundary for useSearchParams
function SearchPageWrapper() {
  const searchParams = useSearchParams();

  return <SearchPageContent key={searchParams.toString()} searchParams={searchParams} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="card p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-slate-200 rounded mb-4"></div>
                  <div className="h-10 bg-slate-200 rounded mb-6"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-6"></div>
                  <div className="h-10 bg-slate-200 rounded"></div>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded mb-4 w-48"></div>
                <div className="h-4 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchPageWrapper />
    </Suspense>
  );
}
