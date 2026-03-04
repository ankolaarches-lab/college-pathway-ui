"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data for colleges
const mockColleges = [
  { id: 1, name: "Stanford University", city: "Stanford", state: "CA", type: "Private 4-Year", tuition: 56169, inStateTuition: 56169, admissionRate: 3.7, graduationRate: 96, medianEarnings: 93600 },
  { id: 2, name: "University of Michigan", city: "Ann Arbor", state: "MI", type: "Public 4-Year", tuition: 16736, inStateTuition: 16736, admissionRate: 17.7, graduationRate: 93, medianEarnings: 72400 },
  { id: 3, name: "UCLA", city: "Los Angeles", state: "CA", type: "Public 4-Year", tuition: 14178, inStateTuition: 14178, admissionRate: 8.8, graduationRate: 91, medianEarnings: 68400 },
  { id: 4, name: "MIT", city: "Cambridge", state: "MA", type: "Private 4-Year", tuition: 57590, inStateTuition: 57590, admissionRate: 3.9, graduationRate: 96, medianEarnings: 113100 },
  { id: 5, name: "UC Berkeley", city: "Berkeley", state: "CA", type: "Public 4-Year", tuition: 14312, inStateTuition: 14312, admissionRate: 11.6, graduationRate: 90, medianEarnings: 76200 },
  { id: 6, name: "Duke University", city: "Durham", state: "NC", type: "Private 4-Year", tuition: 60435, inStateTuition: 60435, admissionRate: 5.1, graduationRate: 96, medianEarnings: 83700 },
  { id: 7, name: "Harvard University", city: "Cambridge", state: "MA", type: "Private 4-Year", tuition: 54269, inStateTuition: 54269, admissionRate: 3.2, graduationRate: 98, medianEarnings: 102100 },
  { id: 8, name: "University of Texas at Austin", city: "Austin", state: "TX", type: "Public 4-Year", tuition: 11448, inStateTuition: 11448, admissionRate: 31.2, graduationRate: 85, medianEarnings: 64200 },
  { id: 9, name: "Yale University", city: "New Haven", state: "CT", type: "Private 4-Year", tuition: 62250, inStateTuition: 62250, admissionRate: 4.4, graduationRate: 97, medianEarnings: 90500 },
  { id: 10, name: "Georgia Tech", city: "Atlanta", state: "GA", type: "Public 4-Year", tuition: 12852, inStateTuition: 12852, admissionRate: 17.0, graduationRate: 89, medianEarnings: 78600 },
];

export default function SearchPage() {
  const [compareList, setCompareList] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    minCost: 0,
    maxCost: 70000,
    admissionRate: 100,
    radius: 100,
  });

  const toggleCompare = (id: number) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter((c) => c !== id));
    } else if (compareList.length < 5) {
      setCompareList([...compareList, id]);
    }
  };

  const filteredColleges = mockColleges.filter((college) => {
    if (filters.type && !college.type.toLowerCase().includes(filters.type.toLowerCase())) return false;
    if (college.tuition > filters.maxCost || college.tuition < filters.minCost) return false;
    if (college.admissionRate > filters.admissionRate) return false;
    return true;
  });

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
              <p className="text-slate-500">{filteredColleges.length} colleges found</p>
            </div>

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
                      <p className="font-semibold text-slate-800">${college.tuition.toLocaleString()}/yr</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Graduation Rate</span>
                      <p className="font-semibold text-teal-600">{college.graduationRate}%</p>
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
