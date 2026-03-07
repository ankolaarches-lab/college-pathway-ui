"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addSearchHistory } from "@/lib/supabase-client";

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
  const [filters, setFilters] = useState({
    type: "",
    minCost: 0,
    maxCost: 70000,
    admissionRate: 100,
    radius: 100,
  });
  
  const { user, isAuthenticated } = useAuth();
  
  // Extract search params into stable values
  const searchType = searchParams.get('type');
  const searchMaxTuition = searchParams.get('max_tuition');
  const searchState = searchParams.get('state');
  const searchQuery = searchParams.get('q');

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
        if (filters.type) params.set('type', filters.type);
        if (filters.maxCost < 70000) params.set('max_tuition', filters.maxCost.toString());
        
        const response = await fetch(`/api/colleges?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch colleges');
        }
        const data = await response.json();
        setColleges(data.colleges || []);
        
        // Save search history if user is logged in
        if (isAuthenticated && user) {
          await addSearchHistory(
            user.id,
            searchQuery || '',
            { type: filters.type, state: searchState, max_tuition: filters.maxCost },
            data.colleges?.length || 0
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
  }, [filters.type, filters.maxCost]);

  const toggleCompare = (id: number) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter((c) => c !== id));
    } else if (compareList.length < 5) {
      setCompareList([...compareList, id]);
    }
  };

  const filteredColleges = colleges.filter((college) => {
    if (filters.type && !college.type.toLowerCase().includes(filters.type.toLowerCase())) return false;
    if (college.tuition && (college.tuition > filters.maxCost || college.tuition < filters.minCost)) return false;
    if (college.admission_rate && college.admission_rate > filters.admissionRate) return false;
    return true;
  });

  const formatTuition = (tuition: number | null) => {
    if (tuition === null) return 'N/A';
    return `$${tuition.toLocaleString()}`;
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Filters</h2>
              
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

              {/* Radius */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Distance: {filters.radius} miles
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="10"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10 mi</span>
                  <span>500 mi</span>
                </div>
              </div>

              <button 
                onClick={() => setFilters({ type: "", minCost: 0, maxCost: 70000, admissionRate: 100, radius: 100 })}
                className="w-full btn-secondary text-sm"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Main Content - Results */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Search Results</h1>
              {loading ? (
                <p className="text-slate-500">Loading colleges...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <p className="text-slate-500">{filteredColleges.length} colleges found</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredColleges.map((college) => (
                    <div key={college.id} className="card p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Link href={`/college/${college.id}`} className="text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
                            {college.name}
                          </Link>
                          <p className="text-slate-500 text-sm">{college.city}, {college.state}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={compareList.includes(college.id)}
                          onChange={() => toggleCompare(college.id)}
                          className="checkbox-primary w-5 h-5"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="badge badge-secondary">{college.type}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500">Tuition</span>
                          <p className="font-semibold text-slate-800">{formatTuition(college.tuition)}/yr</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Graduation Rate</span>
                          <p className="font-semibold text-teal-600">{formatRate(college.graduation_rate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>
                      Previous
                    </button>
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-lg">1</button>
                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                      2
                    </button>
                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                      3
                    </button>
                    <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
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
        <div className="fixed bottom-6 right-6 z-50">
          <Link 
            href={`/compare?colleges=${compareList.join(",")}`}
            className="btn-primary shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare ({compareList.length})
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
