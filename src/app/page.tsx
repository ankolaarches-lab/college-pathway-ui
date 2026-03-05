"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface College {
  id: number;
  name: string;
  city: string;
  state: string;
  type: string;
  tuition: number | null;
  graduation_rate: number | null;
}

export default function Home() {
  const [featuredColleges, setFeaturedColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const response = await fetch('/api/colleges?type=4-year');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setFeaturedColleges((data.colleges || []).slice(0, 6));
      } catch (err) {
        console.error('Error fetching colleges:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-primary pt-20 pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fadeIn">
            Find Your Perfect College Path
          </h1>
          <p className="text-xl text-teal-50 mb-10 max-w-2xl mx-auto animate-fadeIn animate-delay-100">
            Discover the right college for your future. Compare tuition, outcomes, and find your dream school.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-2 animate-fadeIn animate-delay-200">
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search by name or location..."
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700"
              />
              <Link href="/search" className="btn-primary whitespace-nowrap">
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Colleges
              </Link>
            </form>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 animate-fadeIn animate-delay-300">
            <Link href="/search?type=2year" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-colors">
              2-Year Colleges
            </Link>
            <Link href="/search?type=4year" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-colors">
              4-Year Colleges
            </Link>
            <Link href="/search?type=public" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-colors">
              Public
            </Link>
            <Link href="/search?type=private" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-medium transition-colors">
              Private
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Colleges Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Featured Colleges</h2>
            <p className="text-slate-600">Explore top-rated institutions across the country</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : featuredColleges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredColleges.map((college) => (
                <Link href={`/college/${college.id}`} key={college.id} className="card p-6 block">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{college.name}</h3>
                      <p className="text-slate-500 text-sm">{college.city}, {college.state}</p>
                    </div>
                    <span className="badge badge-secondary">{college.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-teal-600">
                      {college.tuition ? `$${college.tuition.toLocaleString()}` : 'N/A'}/yr
                    </span>
                    {college.graduation_rate && (
                      <span className="text-sm text-slate-500">
                        {college.graduation_rate.toFixed(0)}% grad rate
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Fallback mock data if API fails */}
              {[
                { name: "Stanford University", location: "Stanford, CA", type: "4-Year", tuition: "$56,169" },
                { name: "University of Michigan", location: "Ann Arbor, MI", type: "4-Year", tuition: "$16,736" },
                { name: "UCLA", location: "Los Angeles, CA", type: "4-Year", tuition: "$14,178" },
                { name: "MIT", location: "Cambridge, MA", type: "4-Year", tuition: "$57,590" },
                { name: "UC Berkeley", location: "Berkeley, CA", type: "4-Year", tuition: "$14,312" },
                { name: "Duke University", location: "Durham, NC", type: "4-Year", tuition: "$60,435" },
              ].map((college, index) => (
                <div key={index} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{college.name}</h3>
                      <p className="text-slate-500 text-sm">{college.location}</p>
                    </div>
                    <span className="badge badge-secondary">{college.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-teal-600">{college.tuition}/yr</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/search" className="btn-secondary inline-flex items-center gap-2">
              View All Colleges
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Parents vs Students */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Students */}
            <div className="card p-8">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">For Students</h3>
              <p className="text-slate-600 mb-6">
                Find colleges that match your goals, interests, and budget. Compare outcomes and discover your path to success.
              </p>
              <Link href="/search" className="btn-primary inline-block">
                Start Your Search
              </Link>
            </div>

            {/* For Parents */}
            <div className="card p-8">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">For Parents</h3>
              <p className="text-slate-600 mb-6">
                Research colleges with confidence. Compare costs, graduation rates, and career outcomes to make informed decisions.
              </p>
              <Link href="/search" className="btn-secondary inline-block">
                Explore Colleges
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
