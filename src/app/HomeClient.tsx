"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Award } from 'lucide-react';

interface College {
    id: number;
    name: string;
    city: string;
    state: string;
    type: string;
    tuition: number | null;
    graduation_rate: number | null;
}

export default function HomeClient() {
    const [featuredColleges, setFeaturedColleges] = useState<College[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [collegesRes, leaderboardRes] = await Promise.all([
                    fetch('/api/colleges?tier=1&limit=6'),
                    fetch('/api/leaderboard')
                ]);

                if (collegesRes.ok) {
                    const data = await collegesRes.json();
                    setFeaturedColleges((data.colleges || []).slice(0, 6));
                }

                if (leaderboardRes.ok) {
                    const data = await leaderboardRes.json();
                    setLeaderboard(data);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-48 px-6 lg:px-8">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[160px] rounded-full animate-float"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 blur-[160px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/20 mb-8 animate-fadeIn">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New: Career Outcome Data 2024</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 animate-fadeInUp tracking-tight leading-[0.9] max-w-4xl mx-auto">
                        Find Your <span className="text-indigo-600">Perfect</span> <br className="hidden md:block" /> College Path
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 mb-14 max-w-2xl mx-auto animate-fadeInUp stagger-1 leading-relaxed font-medium">
                        Empowering students and parents with data-driven insights. Compare tuition, careers, and graduation outcomes at a glance.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-3xl mx-auto glass-card-elevated p-3 animate-fadeInUp stagger-2 border-none ring-1 ring-black/5 shadow-2xl shadow-indigo-100/50">
                        <form className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-[1.25rem]">
                            <div className="flex-1 flex items-center px-4 relative">
                                <svg className="w-5 h-5 text-slate-300 absolute left-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="University name, city, or state..."
                                    className="w-full py-4 pl-10 outline-none text-slate-700 text-lg font-medium placeholder:text-slate-300"
                                />
                            </div>
                            <Link href="/search" className="btn-primary flex items-center justify-center gap-2 text-base py-4 px-10 shadow-indigo-200">
                                Search Now
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </form>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mt-12 animate-fadeIn animate-delay-300">
                        {[
                            { label: "Public", href: "/search?type=public" },
                            { label: "Private", href: "/search?type=private" },
                            { label: "4-Year", href: "/search?type=4-year" },
                            { label: "2-Year", href: "/search?type=2-year" }
                        ].map((tag) => (
                            <Link key={tag.label} href={tag.href} className="px-5 py-2.5 rounded-2xl bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm no-underline">
                                {tag.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Colleges Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 mb-4">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Highly Selective</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Elite Institutions</h2>
                        <p className="text-slate-600">Explore the nation's most prestigious Tier 1 universities</p>
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
                                    className={`glass-card p-8 block animate-fadeInUp stagger-${(index % 6) + 1} no-underline group hover:border-indigo-200 transition-all duration-500`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-slate-800 line-clamp-1 mb-1 no-underline group-hover:text-rose-600 transition-colors tracking-tight">{college.name}</h3>
                                            <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest font-bold">
                                                <svg style={{ width: '12px', height: '12px' }} className="mr-1.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {college.city}, {college.state}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-rose-200">
                                                Tier 1
                                            </span>
                                            <span className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                {college.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-50/50 group-hover:border-indigo-100 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Tuition</span>
                                            <span className="font-black text-slate-800 text-lg">
                                                {college.tuition ? `$${college.tuition.toLocaleString()}` : 'N/A'}
                                            </span>
                                        </div>
                                        {college.graduation_rate && (
                                            <div className="text-right flex flex-col">
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">Grad Rate</span>
                                                <span className="font-black text-teal-600 text-lg">
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
                        <Link href="/search?tier=1" className="bg-white border text-rose-600 border-rose-100 hover:bg-rose-50 font-black h-12 px-8 rounded-2xl inline-flex items-center gap-2 text-sm uppercase tracking-widest transition-all shadow-sm">
                            View All Tier 1 Colleges
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Browse by State Section */}
            <section className="py-16 px-4 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">Browse Colleges by State</h2>
                        <p className="text-slate-600">Find the best colleges in your state</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { name: 'California', slug: 'california', code: 'CA' },
                            { name: 'Texas', slug: 'texas', code: 'TX' },
                            { name: 'New York', slug: 'new-york', code: 'NY' },
                            { name: 'Florida', slug: 'florida', code: 'FL' },
                            { name: 'Illinois', slug: 'illinois', code: 'IL' },
                            { name: 'Pennsylvania', slug: 'pennsylvania', code: 'PA' },
                            { name: 'Ohio', slug: 'ohio', code: 'OH' },
                            { name: 'Georgia', slug: 'georgia', code: 'GA' },
                            { name: 'North Carolina', slug: 'north-carolina', code: 'NC' },
                            { name: 'Michigan', slug: 'michigan', code: 'MI' },
                            { name: 'New Jersey', slug: 'new-jersey', code: 'NJ' },
                            { name: 'Virginia', slug: 'virginia', code: 'VA' },
                        ].map((state) => (
                            <Link
                                key={state.slug}
                                href={`/colleges/${state.slug}`}
                                className="glass-card p-5 text-center hover:border-indigo-200 transition-all duration-300 group no-underline"
                            >
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">{state.code}</span>
                                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{state.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link href="/search" className="btn-secondary inline-flex items-center gap-2">
                            View All States
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Community Impact & Leaderboard Section */}
            <section className="py-32 px-6 bg-[#0f172a] text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-[1fr_400px] gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Community Driven</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-[1.1] tracking-tight">
                                Our Community is <br /><span className="text-indigo-400">Powering</span> Better Decisions
                            </h2>
                            <p className="text-lg text-slate-400 mb-12 leading-relaxed font-medium max-w-xl">
                                Official data only tells half the story. Our community of students and parents share real-world costs and experiences to help you find the true path.
                            </p>

                            <div className="grid grid-cols-2 gap-6 mb-12">
                                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-colors">
                                    <p className="text-4xl font-black text-white mb-2 italic">1,200+</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Real Cost Reports</p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-teal-500/30 transition-colors">
                                    <p className="text-4xl font-black text-white mb-2 italic">450+</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Contributors</p>
                                </div>
                            </div>

                            <Link href="/dashboard" className="h-16 inline-flex items-center gap-3 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-950/50 group">
                                Join the Community
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </Link>
                        </div>

                        <div className="glass-card p-10 bg-white/[0.03] border-white/10 shadow-2xl relative group">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-lg font-black tracking-tight">Top Contributors</h3>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Award size={18} />
                                </div>
                            </div>

                            <div className="space-y-8">
                                {leaderboard.length > 0 ? (
                                    leaderboard.map((user, idx) => (
                                        <div key={idx} className="flex items-center gap-5 group/row">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-950 shadow-lg shadow-yellow-400/20' :
                                                idx === 1 ? 'bg-slate-300 text-slate-900 shadow-lg shadow-slate-300/20' :
                                                    idx === 2 ? 'bg-amber-600 text-amber-50 shadow-lg shadow-amber-600/20' : 'bg-white/5 text-slate-400 border border-white/5'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-end mb-2">
                                                    <p className="font-bold text-slate-200 truncate group-hover/row:text-indigo-400 transition-colors">{user.display_name || 'Anonymous'}</p>
                                                    <span className="text-xs font-black text-slate-500">{user.points} <span className="text-[8px] uppercase tracking-tighter ml-0.5">pts</span></span>
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-600'
                                                            }`}
                                                        style={{ width: `${Math.min((user.points / 1200) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 text-sm italic">Leaderboard is warming up...</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 text-center">
                                <Link href="/community" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                                    View Full Rankings
                                </Link>
                            </div>
                        </div>
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
