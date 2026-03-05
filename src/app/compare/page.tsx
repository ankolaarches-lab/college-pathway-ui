"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

function CompareContent() {
  const searchParams = useSearchParams();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchColleges() {
      const ids = searchParams.get("colleges");
      if (ids) {
        const collegeIds = ids.split(",").map(Number);
        try {
          const response = await fetch(`/api/colleges`);
          if (!response.ok) throw new Error('Failed to fetch');
          const data = await response.json();
          
          // Filter to only the requested IDs
          const filtered = data.colleges.filter((c: College) => collegeIds.includes(c.id));
          setColleges(filtered);
        } catch (err) {
          console.error('Error fetching colleges:', err);
        }
      }
      setLoading(false);
    }

    fetchColleges();
  }, [searchParams]);

  const clearAll = () => {
    setColleges([]);
  };

  // Find best values for highlighting
  const getBestValue = (values: (number | null)[], type: "high" | "low") => {
    const validValues = values.filter((v): v is number => v !== null);
    if (validValues.length === 0) return null;
    if (type === "high") return Math.max(...validValues);
    return Math.min(...validValues);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (colleges.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Colleges to Compare</h2>
          <p className="text-slate-500 mb-6">Add colleges from the search page to compare them side by side.</p>
          <Link href="/search" className="btn-primary inline-block">
            Search Colleges
          </Link>
        </div>
      </div>
    );
  }

  const tuitionValues = colleges.map(c => c.tuition);
  const graduationValues = colleges.map(c => c.graduation_rate);
  const earningsValues = colleges.map(c => c.median_earnings);
  const admissionValues = colleges.map(c => c.admission_rate);

  const formatTuition = (tuition: number | null) => {
    if (tuition === null) return 'N/A';
    return `$${tuition.toLocaleString()}`;
  };

  const formatRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  const formatEarnings = (earnings: number | null) => {
    if (earnings === null) return 'N/A';
    return `$${earnings.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Compare Colleges</h1>
            <p className="text-slate-500">{colleges.length} colleges selected</p>
          </div>
          <button onClick={clearAll} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-100 rounded-tl-lg min-w-48">
                  <span className="text-slate-500 font-medium">Attribute</span>
                </th>
                {colleges.map((college) => (
                  <th key={college.id} className="p-4 bg-white min-w-56">
                    <div className="text-center">
                      <Link href={`/college/${college.id}`} className="text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
                        {college.name}
                      </Link>
                      <p className="text-sm text-slate-500">{college.city}, {college.state}</p>
                      <span className="badge badge-secondary mt-2">{college.type}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Tuition */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Tuition (per year)</td>
                {colleges.map((college) => (
                  <td key={college.id} className={`p-4 text-center ${college.tuition === getBestValue(tuitionValues, "low") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.tuition === getBestValue(tuitionValues, "low") ? "text-teal-600" : "text-slate-800"}`}>
                      {formatTuition(college.tuition)}
                    </span>
                    {college.tuition === getBestValue(tuitionValues, "low") && <span className="block text-xs text-teal-500">Best value</span>}
                  </td>
                ))}
              </tr>

              {/* Admission Rate */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Admission Rate</td>
                {colleges.map((college) => (
                  <td key={college.id} className="p-4 text-center bg-white">
                    <span className="text-lg font-semibold text-slate-800">{formatRate(college.admission_rate)}</span>
                  </td>
                ))}
              </tr>

              {/* Graduation Rate */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Graduation Rate</td>
                {colleges.map((college) => (
                  <td key={college.id} className={`p-4 text-center ${college.graduation_rate === getBestValue(graduationValues, "high") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.graduation_rate === getBestValue(graduationValues, "high") ? "text-teal-600" : "text-slate-800"}`}>
                      {formatRate(college.graduation_rate)}
                    </span>
                    {college.graduation_rate === getBestValue(graduationValues, "high") && <span className="block text-xs text-teal-500">Highest</span>}
                  </td>
                ))}
              </tr>

              {/* Median Earnings */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Median Earnings</td>
                {colleges.map((college) => (
                  <td key={college.id} className={`p-4 text-center ${college.median_earnings === getBestValue(earningsValues, "high") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.median_earnings === getBestValue(earningsValues, "high") ? "text-teal-600" : "text-slate-800"}`}>
                      {formatEarnings(college.median_earnings)}
                    </span>
                    {college.median_earnings === getBestValue(earningsValues, "high") && <span className="block text-xs text-teal-500">Highest</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link href="/search" className="btn-secondary flex-1 text-center">
            ← Back to Search
          </Link>
        </div>
      </div>
    </div>
  );
}

function CompareLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareLoading />}>
      <CompareContent />
    </Suspense>
  );
}
