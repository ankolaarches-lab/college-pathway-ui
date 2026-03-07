"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, isFavorite, getTransferPathways } from "@/lib/supabase-client";

interface NetPriceByIncome {
  '0_30000': number | null;
  '30001_48000': number | null;
  '48001_75000': number | null;
  '75001_110000': number | null;
}

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
  // Additional data from enhanced API
  net_price_by_income?: NetPriceByIncome | null;
  student_faculty_ratio?: number | null;
  loan_stats?: any;
  demographics?: any;
}

export default function CollegeDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const collegeId = params.id;
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriteCollege, setIsFavoriteCollege] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [transferPathways, setTransferPathways] = useState<any>({ pathwaysFrom: [], pathwaysTo: [] });

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchCollege() {
      try {
        const response = await fetch(`/api/colleges?id=${collegeId}`);
        if (!response.ok) {
          throw new Error('College not found');
        }
        const data = await response.json();

        // The API returns { colleges: [], total: n }
        // Let's be robust and check both data.colleges and data directly
        let found = null;
        if (Array.isArray(data.colleges)) {
          found = data.colleges.find((c: College) => c.id === parseInt(collegeId));
        } else if (data.id === parseInt(collegeId)) {
          found = data;
        } else if (data.colleges && !Array.isArray(data.colleges) && data.colleges.id === parseInt(collegeId)) {
          found = data.colleges;
        }

        if (found) {
          setCollege(found);

          // Check if favorited (if logged in)
          if (user) {
            const { data: favData } = await isFavorite(user.id, parseInt(collegeId));
            setIsFavoriteCollege(!!favData);
          }

          // Load transfer pathways
          const pathways = await getTransferPathways(parseInt(collegeId));
          setTransferPathways(pathways);
        } else {
          setError('College not found');
        }
      } catch (err) {
        console.error('Error fetching college:', err);
        setError('Failed to load college data');
      } finally {
        setLoading(false);
      }
    }

    fetchCollege();
  }, [collegeId, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      // Could trigger auth modal here
      return;
    }

    setFavoriting(true);

    try {
      if (isFavoriteCollege) {
        await removeFavorite(user.id, parseInt(params.id));
        setIsFavoriteCollege(false);
      } else {
        await addFavorite(user.id, parseInt(params.id));
        setIsFavoriteCollege(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setFavoriting(false);
    }
  };

  const formatTuition = (tuition: number | null) => {
    if (tuition === null) return 'N/A';
    return `$${tuition.toLocaleString()}`;
  };

  const formatRate = (rate: number | null | undefined) => {
    if (rate === null || rate === undefined) return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  const formatEarnings = (earnings: number | null) => {
    if (earnings === null) return 'N/A';
    return `$${earnings.toLocaleString()}`;
  };

  const formatRatio = (ratio: any) => {
    if (!ratio || ratio === null) return 'N/A';
    if (typeof ratio === 'number') return `${ratio}:1`;
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'College not found'}</p>
          <Link href="/search" className="btn-primary">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const is2Year = college.type?.toLowerCase().includes('2-year') || college.type?.toLowerCase().includes('community');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <span className="badge bg-white/20 text-white mb-4">{college.type}</span>
              <h1 className="text-4xl font-bold text-white mb-2">{college.name}</h1>
              <p className="text-xl text-teal-50">
                {college.city}, {college.state}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriting || !isAuthenticated}
                className={`btn ${isFavoriteCollege ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-teal-600 hover:bg-slate-50'} disabled:opacity-50`}
              >
                <svg className="w-5 h-5 mr-2" fill={isFavoriteCollege ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isFavoriteCollege ? 'Saved' : 'Save'}
              </button>
              <Link href={`/compare?colleges=${collegeId}`} className="btn-primary inline-block">
                Add to Compare
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-4xl mx-auto px-4 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Tuition</p>
            <p className="text-2xl font-bold text-slate-800">{formatTuition(college.tuition)}</p>
            <p className="text-xs text-slate-400">per year</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Admission Rate</p>
            <p className="text-2xl font-bold text-slate-800">{formatRate(college.admission_rate)}</p>
            <p className="text-xs text-slate-400">acceptance rate</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Graduation Rate</p>
            <p className="text-2xl font-bold text-teal-600">{formatRate(college.graduation_rate)}</p>
            <p className="text-xs text-slate-400">6-year rate</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Median Earnings</p>
            <p className="text-2xl font-bold text-slate-800">{formatEarnings(college.median_earnings)}</p>
            <p className="text-xs text-slate-400">10 years after</p>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Student-Faculty Ratio (if available) */}
        {(college.student_faculty_ratio || college.type?.toLowerCase().includes('4-year')) && (
          <section className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Student Experience</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Student-Faculty Ratio</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {college.student_faculty_ratio ? formatRatio(college.student_faculty_ratio) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loan Statistics (if available) */}
        {college.loan_stats && (
          <section className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Financial Aid & Debt</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Students with Federal Loans</p>
                <p className="text-2xl font-bold text-slate-800">
                  {college.loan_stats?.federal_loan_rate ? `${(college.loan_stats.federal_loan_rate * 100).toFixed(0)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Median Debt</p>
                <p className="text-2xl font-bold text-slate-800">
                  {college.loan_stats?.median_debt ? `$${college.loan_stats.median_debt.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-500 text-sm">Pell Grant Recipients</p>
                <p className="text-2xl font-bold text-slate-800">
                  {college.loan_stats?.pell_grant_rate ? `${(college.loan_stats.pell_grant_rate * 100).toFixed(0)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Transfer Pathways Section */}
        {is2Year && transferPathways.pathwaysFrom?.length > 0 && (
          <section className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Transfer Pathways</h2>
            <p className="text-slate-500 mb-6">After completing your degree here, you can transfer to:</p>

            <div className="space-y-4">
              {transferPathways.pathwaysFrom.slice(0, 5).map((pathway: any) => (
                <div key={pathway.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{pathway.target?.name}</p>
                    <p className="text-sm text-slate-500">{pathway.target?.city}, {pathway.target?.state}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${pathway.agreement_type === 'automatic' ? 'badge-primary' : 'badge-secondary'}`}>
                      {pathway.agreement_type || 'Pathway'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {transferPathways.pathwaysFrom.length > 5 && (
              <p className="text-center text-slate-500 mt-4">
                +{transferPathways.pathwaysFrom.length - 5} more transfer options
              </p>
            )}
          </section>
        )}

        {/* If it's a 4-year, show transfer IN options */}
        {!is2Year && transferPathways.pathwaysTo?.length > 0 && (
          <section className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Transfer In Options</h2>
            <p className="text-slate-500 mb-6">Students can transfer from these community colleges:</p>

            <div className="space-y-4">
              {transferPathways.pathwaysTo.slice(0, 5).map((pathway: any) => (
                <div key={pathway.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{pathway.source?.name}</p>
                    <p className="text-sm text-slate-500">{pathway.source?.city}, {pathway.source?.state}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${pathway.agreement_type === 'automatic' ? 'badge-primary' : 'badge-secondary'}`}>
                      {pathway.agreement_type || 'Pathway'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">About</h2>
          <p className="text-slate-600 leading-relaxed">
            {college.name} is located in {college.city}, {college.state}.
            This institution is classified as {college.type}.
            {college.tuition && ` The tuition is approximately ${formatTuition(college.tuition)} per year.`}
            {college.graduation_rate && ` The graduation rate is ${formatRate(college.graduation_rate)}.`}
            {college.median_earnings && ` Graduates typically earn around ${formatEarnings(college.median_earnings)} 10 years after enrollment.`}
          </p>
        </section>

        {/* Net Price by Income Section - #1 thing parents care about */}
        {(college.net_price_by_income || college.tuition) && (
          <section className="card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Average Net Price by Income</h2>
            <p className="text-slate-500 mb-6">What families actually pay after scholarships & grants (based on income):</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Income brackets */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">$0 - $30,000</p>
                    <p className="text-xs text-slate-500">Lowest income</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {college.net_price_by_income?.['0_30000'] !== null
                      ? formatTuition(college.net_price_by_income?.['0_30000'] ?? null)
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">$30,001 - $48,000</p>
                    <p className="text-xs text-slate-500">Low-middle income</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {college.net_price_by_income?.['30001_48000'] !== null
                      ? formatTuition(college.net_price_by_income?.['30001_48000'] ?? null)
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">$48,001 - $75,000</p>
                    <p className="text-xs text-slate-500">Middle income</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {college.net_price_by_income?.['48001_75000'] !== null
                      ? formatTuition(college.net_price_by_income?.['48001_75000'] ?? null)
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">$75,001 - $110,000</p>
                    <p className="text-xs text-slate-500">Upper-middle income</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {college.net_price_by_income?.['75001_110000'] !== null
                      ? formatTuition(college.net_price_by_income?.['75001_110000'] ?? null)
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Full tuition for comparison */}
              <div className="flex flex-col justify-center">
                <div className="bg-slate-100 rounded-xl p-6 text-center">
                  <p className="text-sm text-slate-500 mb-1">Full Tuition (Before Aid)</p>
                  <p className="text-3xl font-bold text-slate-700">{formatTuition(college.tuition)}</p>
                  <p className="text-xs text-slate-400 mt-1">per year</p>
                </div>
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Net price is what students pay after subtracting scholarships, grants, and other financial aid.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Outcomes Section */}
        <section className="card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <svg className="w-8 h-8 text-teal-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-slate-800">Median Salary</p>
              <p className="text-teal-600 text-lg font-bold">{formatEarnings(college.median_earnings)}</p>
              <p className="text-xs text-slate-400">10 years after enrollment</p>
            </div>
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <svg className="w-8 h-8 text-teal-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="font-semibold text-slate-800">Graduation Rate</p>
              <p className="text-teal-600 text-lg font-bold">{formatRate(college.graduation_rate)}</p>
              <p className="text-xs text-slate-400">within 6 years</p>
            </div>
            <div className="text-center p-4 border border-slate-200 rounded-lg">
              <svg className="w-8 h-8 text-teal-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-slate-800">Employment Rate</p>
              <p className="text-teal-600 text-lg font-bold">N/A</p>
              <p className="text-xs text-slate-400">within 2 years</p>
            </div>
          </div>
        </section>

        {/* Quick Facts */}
        <section className="card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Facts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Location</span>
              <span className="font-semibold text-slate-800">{college.city}, {college.state}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Type</span>
              <span className="font-semibold text-slate-800">{college.type}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">In-State Tuition</span>
              <span className="font-semibold text-slate-800">{formatTuition(college.tuition)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500">Admission Rate</span>
              <span className="font-semibold text-slate-800">{formatRate(college.admission_rate)}</span>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/search" className="btn-secondary flex-1 text-center">
            ← Back to Search
          </Link>
          <Link href={`/compare?colleges=${collegeId}`} className="btn-primary flex-1 text-center">
            Compare This College
          </Link>
        </div>
      </div>
    </div>
  );
}
