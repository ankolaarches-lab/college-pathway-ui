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
      <section className="relative overflow-hidden pt-24 pb-40 px-4">
        <div className="absolute inset-0 gradient-primary -z-10 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 -z-10"></div>

        <div className="max-w-5xl mx-auto text-center relative">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 animate-fadeInUp tracking-tight">
            Find Your <span className="text-cyan-200">Perfect</span> College Path
          </h1>
          <p className="text-xl sm:text-2xl text-teal-50 mb-12 max-w-3xl mx-auto animate-fadeInUp stagger-1 opacity-90 leading-relaxed font-light">
            Empowering students and parents with data-driven insights. Compare tuition, careers, and graduation outcomes at a glance.
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-2 animate-fadeInUp stagger-2 border border-white/20">
            <form className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-xl">
              <div className="flex-1 flex items-center px-4">
                <input
                  type="text"
                  placeholder="University name, city, or state..."
                  className="w-full py-3 outline-none text-slate-700 text-lg"
                />
              </div>
              <Link href="/search" className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8">
                Search Now
              </Link>
            </form>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-fadeIn animate-delay-300">
            <Link href="/search?type=2year" className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-full font-medium transition-all backdrop-blur-sm border border-white/10 hover:scale-105 no-underline">
              2-Year Colleges
            </Link>
            <Link href="/search?type=4year" className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-full font-medium transition-all backdrop-blur-sm border border-white/10 hover:scale-105 no-underline">
              4-Year Colleges
            </Link>
            <Link href="/search?type=public" className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-full font-medium transition-all backdrop-blur-sm border border-white/10 hover:scale-105 no-underline">
              Public
            </Link>
            <Link href="/search?type=private" className="bg-white/20 hover:bg-white/30 text-white px-6 py-2.5 rounded-full font-medium transition-all backdrop-blur-sm border border-white/10 hover:scale-105 no-underline">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-8 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredColleges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredColleges.map((college, index) => (
                <Link
                  href={`/college/${college.id}`}
                  key={college.id}
                  className={`card p-8 block animate-fadeInUp stagger-${(index % 6) + 1} no-underline group`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 line-clamp-1 mb-1 no-underline group-hover:text-teal-600 transition-colors">{college.name}</h3>
                      <div className="flex items-center text-slate-500 text-sm">
                        <svg style={{ width: '16px', height: '16px' }} className="mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {college.city}, {college.state}
                      </div>
                    </div>
                    <span className="badge badge-primary">{college.type}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tuition</span>
                      <span className="font-bold text-teal-600 text-lg">
                        {college.tuition ? `$${college.tuition.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    {college.graduation_rate && (
                      <div className="text-right flex flex-col">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Grad Rate</span>
                        <span className="font-bold text-slate-700 text-lg">
                          {college.graduation_rate.toFixed(0)}%
                        </span>
                      </div>
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
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg style={{ width: '24px', height: '24px' }} className="text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg style={{ width: '24px', height: '24px' }} className="text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
