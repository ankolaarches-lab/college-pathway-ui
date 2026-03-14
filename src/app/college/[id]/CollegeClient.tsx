"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { addFavorite, removeFavorite, isFavorite, getTransferPathways } from "@/lib/supabase-client";
import StudentExperiences from "@/components/StudentExperiences";
import LocalStatistics from "@/components/LocalStatistics";
import {
    GraduationCap,
    MapPin,
    DollarSign,
    Users,
    BookOpen,
    Shield,
    ArrowRight,
    Heart,
    Award,
    BarChart3,
    Building2,
    Scale,
    AlertTriangle,
    Info,
    RotateCcw,
    Briefcase
} from 'lucide-react';

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
    net_price_by_income?: NetPriceByIncome | null;
    student_faculty_ratio?: number | null;
    loan_stats?: any;
    demographics?: any;
    retention_rate?: number | null;
    description?: string | null;
    crime_stats?: any;
    city_crime_stats?: any;
    local_housing_stats?: any;
}

export default function CollegeClient({ collegeId }: { collegeId: string }) {
    const [college, setCollege] = useState<College | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavoriteCollege, setIsFavoriteCollege] = useState(false);
    const [favoriting, setFavoriting] = useState(false);
    const [transferPathways, setTransferPathways] = useState<any>({ pathwaysFrom: [], pathwaysTo: [] });
    const [programs, setPrograms] = useState<any[]>([]);

    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        async function fetchCollege() {
            try {
                const response = await fetch(`/api/colleges?id=${collegeId}`);
                if (!response.ok) {
                    throw new Error('College not found');
                }
                const data = await response.json();

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

                    if (user) {
                        const { data: favData } = await isFavorite(user.id, parseInt(collegeId));
                        setIsFavoriteCollege(!!favData);
                    }

                    const [pathways, programsRes] = await Promise.all([
                        getTransferPathways(parseInt(collegeId)),
                        import('@/lib/supabase-client').then(m => m.getInstitutionPrograms(parseInt(collegeId)))
                    ]);

                    setTransferPathways(pathways);
                    if (programsRes.data) {
                        setPrograms(programsRes.data);
                    }
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
        if (!user) return;
        setFavoriting(true);
        try {
            if (isFavoriteCollege) {
                await removeFavorite(user.id, parseInt(collegeId));
                setIsFavoriteCollege(false);
            } else {
                await addFavorite(user.id, parseInt(collegeId));
                setIsFavoriteCollege(true);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        } finally {
            setFavoriting(false);
        }
    };

    const formatTuition = (tuition: number | null) => {
        if (tuition === null) return 'Not Reported';
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
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero Section */}
            <section className="relative pt-32 pb-40 px-6 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-float"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                        <div className="space-y-8 flex-1">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                                    {college.type}
                                </span>
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 shadow-sm">
                                    <MapPin size={12} className="text-indigo-500" />
                                    {college.city}, {college.state}
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tight max-w-4xl">
                                {college.name}
                            </h1>
                            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
                                Explore one of the most distinguished institutions in <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">{college.state}</span>. Your pathway to a brighter future begins here.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
                            <button
                                onClick={handleFavoriteToggle}
                                disabled={favoriting || !isAuthenticated}
                                className={`h-16 px-8 rounded-3xl flex items-center justify-center gap-3 transition-all font-black text-sm uppercase tracking-widest ${isFavoriteCollege
                                    ? 'bg-rose-500 text-white shadow-2xl shadow-rose-200 hover:scale-105 active:scale-95'
                                    : 'bg-white text-slate-500 border border-slate-100 hover:text-rose-500 hover:border-rose-100 shadow-xl shadow-slate-200/50 hover:scale-105 active:scale-95'
                                    } disabled:opacity-50`}
                            >
                                <Heart fill={isFavoriteCollege ? "currentColor" : "none"} size={22} className={isFavoriteCollege ? 'animate-pulse' : ''} />
                                {isFavoriteCollege ? 'Saved' : 'Save'}
                            </button>
                            <Link
                                href={`/compare?colleges=${collegeId}`}
                                className="h-16 px-10 bg-indigo-600 text-white rounded-3xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all"
                            >
                                <BarChart3 size={20} />
                                <span>Compare</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Annual Tuition', value: formatTuition(college.tuition), sub: 'Average Sticker Price', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100/50' },
                        { label: 'Admission Rate', value: formatRate(college.admission_rate), sub: 'Selectivity Level', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50/50', border: 'border-teal-100/50' },
                        { label: 'Graduation Rate', value: formatRate(college.graduation_rate), sub: 'Completion Success', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100/50' },
                        { label: 'Median Earnings', value: formatEarnings(college.median_earnings), sub: '10y Career Outlook', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100/50' }
                    ].map((stat, i) => (
                        <div key={i} className={`glass-card-elevated p-8 group hover:translate-y-[-8px] transition-all duration-500 ${stat.border}`}>
                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                <stat.icon size={28} />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
                            <p className="text-4xl font-black text-slate-800 tracking-tight mb-2">{stat.value}</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${stat.color} animate-pulse`}></div>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Content Areas */}
            <div className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column - Detailed Info */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* About Section */}
                        <section className="glass-card p-10 relative group overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl group-hover:bg-indigo-100/40 transition-colors"></div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <BookOpen size={24} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">About Institution</h2>
                            </div>
                            {college.description ? (
                                <div className="text-slate-600 leading-relaxed text-lg font-medium">
                                    <p className="mb-8">{college.description}</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                                        <Info size={14} className="text-slate-400" />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Source: Wikipedia Data</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                                    {college.name} is a distinguished {college.type} institution located in {college.city}, {college.state}.
                                    {college.tuition && ` With a competitive tuition profile of $${college.tuition.toLocaleString()}, it remains an attractive choice for ambitious students.`}
                                    {college.graduation_rate && ` A strong graduation rate of ${formatRate(college.graduation_rate)} underscores its academic rigor and effective student support systems.`}
                                </p>
                            )}
                        </section>

                        {/* Top Programs Section */}
                        {programs && programs.length > 0 && (
                            <section className="glass-card p-10 overflow-hidden">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                            <Briefcase size={24} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Top Career Paths</h2>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full">By Median Earnings</span>
                                </div>
                                <div className="space-y-4">
                                    {programs.slice(0, 10).map((program: any, i) => (
                                        <div key={i} className="group p-6 bg-white/40 hover:bg-white rounded-3xl border border-white hover:border-indigo-100/50 hover:shadow-xl hover:shadow-indigo-100/20 transition-all duration-300">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-black text-slate-800 tracking-tight">{program.title}</h3>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-md">{program.credential_title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                            <DollarSign size={14} className="text-teal-500" />
                                                            <span className="text-indigo-600 font-black">{formatEarnings(program.median_earnings)}</span>
                                                            <span className="uppercase tracking-widest text-[10px]">Avg Salary</span>
                                                        </div>
                                                        {program.median_debt && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                                <Scale size={14} className="text-amber-500" />
                                                                <span className="text-slate-600 font-black">{formatTuition(program.median_debt)}</span>
                                                                <span className="uppercase tracking-widest text-[10px]">Avg Debt</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-full md:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                                            style={{ width: `${Math.min(100, (program.median_earnings || 0) / 1000)}%` }}
                                                        ></div>
                                                    </div>
                                                    <ArrowRight size={18} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Demographics & Student Body */}
                        {college.demographics && (
                            <section className="glass-card p-10 overflow-hidden group">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Users size={24} />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Community</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-16">
                                    {/* Gender Balance */}
                                    <div className="space-y-8">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Gender Balance</h3>
                                            <div className="flex gap-4">
                                                <span className="flex items-center gap-2 text-xs font-black text-slate-800">
                                                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm shadow-indigo-100"></div> Women
                                                </span>
                                                <span className="flex items-center gap-2 text-xs font-black text-slate-800">
                                                    <div className="w-3 h-3 rounded-full bg-teal-400 shadow-sm shadow-teal-100"></div> Men
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative pt-6">
                                            <div className="flex bg-slate-100 rounded-[2rem] h-12 p-2 shadow-inner">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-full rounded-[1.5rem] flex items-center justify-center text-[11px] font-black text-white shadow-xl shadow-indigo-100/50 transition-all duration-1000 group-hover:animate-pulse"
                                                    style={{ width: `${(college.demographics.women || 0.5) * 100}%` }}
                                                >
                                                    {formatRate(college.demographics.women)}
                                                </div>
                                                <div
                                                    className="bg-gradient-to-r from-teal-400 to-teal-500 h-full rounded-[1.5rem] flex items-center justify-center text-[11px] font-black text-white shadow-xl shadow-teal-100/50 ml-2 transition-all duration-1000"
                                                    style={{ width: `${(college.demographics.men || 0.5) * 100}%` }}
                                                >
                                                    {formatRate(college.demographics.men)}
                                                </div>
                                            </div>
                                            <div className="absolute top-0 left-0 w-full flex justify-between px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                <span>Femininity</span>
                                                <span>Masculinity</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Race & Ethnicity */}
                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ethnic Diversity</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { label: 'White', value: college.demographics.white, color: 'bg-slate-800' },
                                                { label: 'Hispanic', value: college.demographics.hispanic, color: 'bg-indigo-500' },
                                                { label: 'Asian', value: college.demographics.asian, color: 'bg-teal-500' },
                                                { label: 'Black', value: college.demographics.black, color: 'bg-emerald-500' },
                                                { label: 'International', value: college.demographics.non_resident_alien, color: 'bg-amber-500' }
                                            ]
                                                .filter(d => d.value && d.value > 0.01)
                                                .sort((a, b) => b.value - a.value)
                                                .map((demo, idx) => (
                                                    <div key={demo.label} className="group/item flex items-center gap-4">
                                                        <div className="w-24 text-[10px] font-black text-slate-400 uppercase tracking-widest">{demo.label}</div>
                                                        <div className="flex-1 bg-slate-50 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className={`${demo.color} h-full rounded-full transition-all duration-500 group-hover/item:opacity-80`}
                                                                style={{ width: `${demo.value * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="w-12 text-xs font-black text-slate-800 text-right">
                                                            {formatRate(demo.value)}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Student Experiences */}
                        <StudentExperiences institutionId={parseInt(collegeId)} institutionName={college.name} />

                        {/* Campus Safety */}
                        {college.crime_stats && (
                            <section className="glass-card p-10 relative overflow-hidden group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                                            <Shield size={24} />
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Security Audit</h2>
                                    </div>
                                    <div className="h-10 px-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                        <AlertTriangle size={14} />
                                        Safety Rating: 3-Year Aggregate
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                    {[
                                        { label: 'Incidents', value: college.crime_stats.total_incidents, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                                        { label: 'Burglary', value: college.crime_stats.burglary, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                                        { label: 'Theft', value: college.crime_stats.motor_vehicle_theft, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                                        { label: 'Assault', value: college.crime_stats.aggravated_assault, icon: Info, color: 'text-teal-600', bg: 'bg-teal-50/50' }
                                    ].map((crime, i) => (
                                        <div key={i} className="bg-white/40 p-8 rounded-[2rem] border border-white text-center hover:shadow-2xl hover:shadow-rose-100/20 transition-all duration-300">
                                            <div className={`w-10 h-10 ${crime.bg} ${crime.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                                                <crime.icon size={20} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{crime.label}</p>
                                            <p className="text-4xl font-black text-slate-800 leading-none">{crime.value ?? 0}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl">
                                    {[
                                        { label: 'Robbery', val: college.crime_stats.robbery },
                                        { label: 'Rape', val: college.crime_stats.rape },
                                        { label: 'Arson', val: college.crime_stats.arson },
                                        { label: 'Murder', val: college.crime_stats.murder }
                                    ].map((item, i) => (
                                        <div key={i} className="text-center">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                            <p className="text-xl font-black text-white">{item.val ?? 0}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column - Sidebar Widgets */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Financial Sidebar */}
                        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                <DollarSign size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-6 tracking-tight">Financial Outlook</h3>
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Sticker Price</p>
                                        <p className={`font-black text-white tracking-tighter ${college.tuition === null ? 'text-xl' : 'text-4xl'}`}>
                                            {formatTuition(college.tuition)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">Estimated cost before aid.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Price By Income</h4>
                                        {[
                                            { range: '$0 - $30k', val: college.net_price_by_income?.['0_30000'] },
                                            { range: '$30k - $48k', val: college.net_price_by_income?.['30001_48000'] },
                                            { range: '$48k - $75k', val: college.net_price_by_income?.['48001_75000'] },
                                            { range: '$75k+', val: college.net_price_by_income?.['75001_110000'] }
                                        ].map((price, i) => (
                                            <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                                                <span className="text-xs font-bold text-slate-400">{price.range}</span>
                                                <span className="text-sm font-black text-emerald-400">{formatTuition(price.val ?? null)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-8 text-[11px] text-slate-500 leading-relaxed italic">
                                    * Most students receive significant grants and scholarships, reducing the actual cost.
                                </p>
                            </div>
                        </section>

                        {/* Transfer Pathways Widget */}
                        {(is2Year ? transferPathways.pathwaysFrom?.length > 0 : transferPathways.pathwaysTo?.length > 0) && (
                            <section className="glass-card p-8 border-indigo-50/50">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                        <ArrowRight size={20} className={is2Year ? '' : 'rotate-180'} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Transfer Routes</h3>
                                </div>
                                <div className="space-y-4">
                                    {(is2Year ? transferPathways.pathwaysFrom : transferPathways.pathwaysTo).slice(0, 4).map((pathway: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/40 rounded-2xl border border-white hover:border-indigo-100 transition-all cursor-pointer group">
                                            <p className="text-sm font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-indigo-600">{is2Year ? pathway.target?.name : pathway.source?.name}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{pathway.agreement_type || 'Streamlined'}</span>
                                                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <ArrowRight size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/transfer-pathways" className="mt-6 w-full h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all">
                                    Explore All Routes
                                </Link>
                            </section>
                        )}

                        {/* Quick Facts Sidebar */}
                        <section className="glass-card p-8 bg-indigo-50/30 border-none">
                            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-[0.2em] mb-6">Quick Overview</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Faculty Ratio', value: formatRatio(college.student_faculty_ratio), icon: Users },
                                    { label: 'Retention', value: formatRate(college.retention_rate), icon: RotateCcw },
                                    { label: 'Success', value: formatRate(college.graduation_rate), icon: Award },
                                    { label: 'In-State Cost', value: formatTuition(college.tuition), icon: DollarSign }
                                ].map((fact, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-indigo-400">
                                            <fact.icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">{fact.label}</p>
                                            <p className="text-sm font-black text-indigo-950">{fact.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-20 flex flex-col sm:flex-row gap-6">
                    <Link href="/search" className="flex-1 h-20 rounded-[2rem] flex items-center justify-center font-black text-slate-500 bg-white border border-slate-100 hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-200/50 transition-all group px-8">
                        <ArrowRight size={20} className="mr-3 rotate-180 text-slate-300 group-hover:text-indigo-500 group-hover:-translate-x-1 transition-all" />
                        Explore More Institutions
                    </Link>
                    <Link
                        href={`/compare?colleges=${collegeId}`}
                        className="flex-1 h-20 rounded-[2rem] flex items-center justify-center font-black text-white bg-indigo-600 shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all px-8 text-lg"
                    >
                        Compare {college.name}
                    </Link>
                </div>
            </div>

            {/* Local Stats Section - Wide Background wrap */}
            <div className="bg-white/40 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <LocalStatistics
                        cityName={college.city}
                        cityCrimeStats={college.city_crime_stats}
                        localHousingStats={college.local_housing_stats}
                        campusCrimeStats={college.crime_stats}
                    />
                </div>
            </div>
        </div>
    );
}
