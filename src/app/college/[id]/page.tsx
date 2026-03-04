"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function CollegeDetailPage({ params }: { params: { id: string } }) {
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollege() {
      try {
        const response = await fetch(`/api/colleges?id=${params.id}`);
        if (!response.ok) {
          throw new Error('College not found');
        }
        const data = await response.json();
        
        // The API returns { colleges: [], total: n }, we need to find by id
        const found = data.colleges?.find((c: College) => c.id === parseInt(params.id));
        if (found) {
          setCollege(found);
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
  }, [params.id]);

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

  return (
    <div className="min-h-screen bg-slate-50">
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
              <button className="btn bg-white text-teal-600 hover:bg-slate-50">
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Save
              </button>
              <Link href={`/compare?colleges=${params.id}`} className="btn-primary inline-block">
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

        {/* Cost After Aid Section */}
        <section className="card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Cost After Aid</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-teal-50 rounded-xl p-6">
              <p className="text-sm text-teal-600 mb-1">Estimated Cost (In-State)</p>
              <p className="text-3xl font-bold text-teal-700">{formatTuition(college.tuition)}</p>
              <p className="text-xs text-teal-500 mt-1">per year after scholarships & grants</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-6">
              <p className="text-sm text-cyan-600 mb-1">Estimated Cost (Out-of-State)</p>
              <p className="text-3xl font-bold text-cyan-700">{formatTuition(college.tuition ? college.tuition * 2 : null)}</p>
              <p className="text-xs text-cyan-500 mt-1">per year after scholarships & grants</p>
            </div>
          </div>
        </section>

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
          <Link href={`/compare?colleges=${params.id}`} className="btn-primary flex-1 text-center">
            Compare This College
          </Link>
        </div>
      </div>
    </div>
  );
}
