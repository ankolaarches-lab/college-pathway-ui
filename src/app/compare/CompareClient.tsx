"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Building2,
    GraduationCap,
    DollarSign,
    Award,
    ArrowLeft,
    Trash2,
    CheckCircle2,
    MapPin,
    TrendingUp,
    BarChart3
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

export default function CompareClient() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading comparison tool...</p>
                </div>
            </div>
        }>
            <CompareContentLoader />
        </Suspense>
    );
}

function CompareContentLoader() {
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

    const getBestValue = (values: (number | null)[], type: "high" | "low") => {
        const validValues = values.filter((v): v is number => v !== null);
        if (validValues.length === 0) return null;
        if (type === "high") return Math.max(...validValues);
        return Math.min(...validValues);
    };

    const tuitionValues = colleges.map(c => c.tuition);
    const graduationValues = colleges.map(c => c.graduation_rate);
    const earningsValues = colleges.map(c => c.median_earnings);

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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

    return (
        <div className="min-h-screen bg-slate-50/50 py-16 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Compare Colleges</h1>
                        </div>
                        <p className="text-slate-400 font-bold text-sm ml-5 uppercase tracking-widest">
                            Comparing <span className="text-indigo-600">{colleges.length}</span> institutions side-by-side
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/search" className="h-12 px-6 rounded-2xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all">
                            <ArrowLeft size={16} />
                            Add More
                        </Link>
                        <button onClick={clearAll} className="h-12 px-6 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
                    <div className="hidden lg:flex flex-col pt-[260px] gap-20">
                        {[
                            { label: 'Tuition', sub: 'Per Academic Year', icon: DollarSign },
                            { label: 'Admission Rate', sub: 'Selectivity level', icon: BarChart3 },
                            { label: 'Graduation Rate', sub: 'Within 6 years', icon: GraduationCap },
                            { label: 'Median Earnings', sub: '10-yr Post Entry', icon: TrendingUp }
                        ].map((attr) => (
                            <div key={attr.label} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:shadow-indigo-50 transition-all">
                                    <attr.icon size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{attr.label}</p>
                                    <p className="text-[10px] text-slate-400 font-bold italic">{attr.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {colleges.map((college) => (
                            <div key={college.id} className="glass-card flex flex-col overflow-hidden animate-fadeInUp">
                                <div className="p-8 border-b border-indigo-50/50 bg-white/40">
                                    <Link href={`/college/${college.id}`} className="text-xl font-black text-slate-800 hover:text-indigo-600 transition-colors block mb-2 tracking-tight line-clamp-2 min-h-[56px]">
                                        {college.name}
                                    </Link>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">
                                        <MapPin size={12} className="text-indigo-400" />
                                        {college.city}, {college.state}
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                                        {college.type}
                                    </span>
                                </div>

                                <div className="p-8 space-y-16 flex-1 bg-white/20">
                                    <div className={`p-6 rounded-3xl border transition-all ${college.tuition === getBestValue(tuitionValues, "low") ? "bg-teal-50/50 border-teal-100 shadow-sm shadow-teal-50" : "bg-white/50 border-white"}`}>
                                        <div className="lg:hidden mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tuition</div>
                                        <div className="flex items-end justify-between">
                                            <p className={`text-2xl font-black ${college.tuition === getBestValue(tuitionValues, "low") ? "text-teal-600" : "text-slate-800"}`}>
                                                {formatTuition(college.tuition)}
                                            </p>
                                            {college.tuition === getBestValue(tuitionValues, "low") && (
                                                <div className="flex items-center gap-1 bg-teal-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                                    <CheckCircle2 size={10} />
                                                    Best Value
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-6">
                                        <div className="lg:hidden mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Rate</div>
                                        <p className="text-2xl font-black text-slate-800">{formatRate(college.admission_rate)}</p>
                                    </div>

                                    <div className={`p-6 rounded-3xl border transition-all ${college.graduation_rate === getBestValue(graduationValues, "high") ? "bg-indigo-50/50 border-indigo-100 shadow-sm shadow-indigo-50" : "bg-white/50 border-white"}`}>
                                        <div className="lg:hidden mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Graduation Rate</div>
                                        <div className="flex items-end justify-between">
                                            <p className={`text-2xl font-black ${college.graduation_rate === getBestValue(graduationValues, "high") ? "text-indigo-600" : "text-slate-800"}`}>
                                                {formatRate(college.graduation_rate)}
                                            </p>
                                            {college.graduation_rate === getBestValue(graduationValues, "high") && (
                                                <div className="flex items-center gap-1 bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                                    <Award size={10} />
                                                    Highest
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`p-6 rounded-3xl border transition-all ${college.median_earnings === getBestValue(earningsValues, "high") ? "bg-amber-50/50 border-amber-100 shadow-sm shadow-amber-50" : "bg-white/50 border-white"}`}>
                                        <div className="lg:hidden mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Median Earnings</div>
                                        <div className="flex items-end justify-between">
                                            <p className={`text-2xl font-black ${college.median_earnings === getBestValue(earningsValues, "high") ? "text-amber-600" : "text-slate-800"}`}>
                                                {formatEarnings(college.median_earnings)}
                                            </p>
                                            {college.median_earnings === getBestValue(earningsValues, "high") && (
                                                <div className="flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                                    <TrendingUp size={10} />
                                                    Top Earner
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-16 flex flex-col sm:flex-row gap-6">
                    <Link href="/search" className="h-16 flex-1 rounded-3xl flex items-center justify-center font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
                        ← Back to Search
                    </Link>
                    <Link href="/dashboard" className="h-16 flex-1 rounded-3xl flex items-center justify-center font-black text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:shadow-xl hover:shadow-teal-200 transition-all shadow-lg">
                        View My Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
