"use client";

import { useState, useEffect, use } from "react";
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
  Share2,
  Award,
  BarChart3,
  Building2,
  Scale,
  AlertTriangle,
  Info,
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
  // Additional data from enhanced API
  net_price_by_income?: NetPriceByIncome | null;
  student_faculty_ratio?: number | null;
  loan_stats?: any;
  demographics?: any;
  retention_rate?: number | null;
  description?: string | null;
  crime_stats?: any;
  city_crime_stats?: any; // Added from instruction
  local_housing_stats?: any; // Added from instruction
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

          // Load transfer pathways and programs in parallel
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-3">
                <span className="badge badge-vibrant">{college.type}</span>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <MapPin size={14} className="text-teal-500" />
                  {college.city}, {college.state}
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                {college.name}
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                Empowering your educational journey at one of the top institutions in <span className="text-slate-800 font-semibold">{college.state}</span>.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriting || !isAuthenticated}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isFavoriteCollege
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                  : 'bg-white text-slate-400 border border-slate-100 hover:text-rose-500 hover:border-rose-100 shadow-sm'
                  } disabled:opacity-50`}
              >
                <Heart fill={isFavoriteCollege ? "currentColor" : "none"} size={24} />
              </button>
              <Link href={`/compare?colleges=${collegeId}`} className="btn-primary flex items-center gap-2 h-14 px-8 shadow-xl shadow-indigo-100">
                <BarChart3 size={20} />
                <span>Add to Compare</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Annual Tuition', value: formatTuition(college.tuition), sub: 'Sticker Price', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Admission Rate', value: formatRate(college.admission_rate), sub: 'Selectivity', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Graduation Rate', value: formatRate(college.graduation_rate), sub: 'within 6 years', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Median Earnings', value: formatEarnings(college.median_earnings), sub: '10y after entry', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' }
          ].map((stat, i) => (
            <div key={i} className="glass-card-elevated p-6 group hover:translate-y-[-4px] transition-all border-none shadow-xl shadow-slate-200/50">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-5xl mx-auto px-6 py-20 space-y-20">

        {/* Student-Faculty Ratio (if available) */}
        {(college.student_faculty_ratio || college.type?.toLowerCase().includes('4-year')) && (
          <section className="glass-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <Users size={120} />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Experience</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="flex items-center gap-6 p-6 bg-white/50 rounded-3xl border border-slate-100 transition-all hover:shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Student-Faculty Ratio</p>
                  <p className="text-4xl font-black text-slate-800">
                    {college.student_faculty_ratio ? formatRatio(college.student_faculty_ratio) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loan Statistics (if available) */}
        {college.loan_stats && (
          <section className="glass-card p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <DollarSign size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Aid & Debt</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: 'Students with Loans', value: college.loan_stats?.federal_loan_rate ? `${(college.loan_stats.federal_loan_rate * 100).toFixed(0)}%` : 'N/A' },
                { label: 'Median Student Debt', value: college.loan_stats?.median_debt ? `$${college.loan_stats.median_debt.toLocaleString()}` : 'N/A' },
                { label: 'Pell Grant Recipients', value: college.loan_stats?.pell_grant_rate ? `${(college.loan_stats.pell_grant_rate * 100).toFixed(0)}%` : 'N/A' }
              ].map((item, i) => (
                <div key={i} className="bg-white/40 p-6 rounded-3xl border border-white shadow-sm">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-3xl font-black text-slate-800 leading-none">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transfer Pathways Section */}
        {is2Year && transferPathways.pathwaysFrom?.length > 0 && (
          <section className="glass-card p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <ArrowRight size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Transfer Pathways</h2>
            </div>
            <p className="text-slate-500 mb-8 italic">Guaranteed or streamlined pathways to 4-year institutions.</p>

            <div className="space-y-4">
              {transferPathways.pathwaysFrom.slice(0, 5).map((pathway: any) => (
                <div key={pathway.id} className="flex items-center justify-between p-6 bg-white/60 rounded-3xl border border-white hover:border-indigo-100 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{pathway.target?.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{pathway.target?.city}, {pathway.target?.state}</p>
                    </div>
                  </div>
                  <span className={`badge ${pathway.agreement_type === 'automatic' ? 'badge-vibrant' : 'bg-slate-100 text-slate-500'}`}>
                    {pathway.agreement_type || 'Pathway'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* If it's a 4-year, show transfer IN options */}
        {!is2Year && transferPathways.pathwaysTo?.length > 0 && (
          <section className="glass-card p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <ArrowRight size={24} className="rotate-180" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Transfer Pathways</h2>
            </div>
            <p className="text-slate-500 mb-8 italic">Popular community colleges that transfer into this institution.</p>

            <div className="space-y-4">
              {transferPathways.pathwaysTo.slice(0, 5).map((pathway: any) => (
                <div key={pathway.id} className="flex items-center justify-between p-6 bg-white/60 rounded-3xl border border-white hover:border-indigo-100 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{pathway.source?.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{pathway.source?.city}, {pathway.source?.state}</p>
                    </div>
                  </div>
                  <span className={`badge ${pathway.agreement_type === 'automatic' ? 'badge-vibrant' : 'bg-slate-100 text-slate-500'}`}>
                    {pathway.agreement_type || 'Pathway'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="glass-card p-10 relative group">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <BookOpen size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">About</h2>
          </div>
          {college.description ? (
            <div className="text-slate-600 leading-relaxed mb-4 text-lg">
              <p>{college.description}</p>
              <p className="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest">Source: Wikipedia</p>
            </div>
          ) : (
            <p className="text-slate-600 leading-relaxed text-lg">
              {college.name} is a distinguished {college.type} institution located in the heart of {college.city}, {college.state}.
              {college.tuition && ` With an annual tuition of approximately ${formatTuition(college.tuition)}, it offers a competitive educational environment.`}
              {college.graduation_rate && ` The institution boasts a graduation rate of ${formatRate(college.graduation_rate)}, reflecting its commitment to student success and academic excellence.`}
            </p>
          )}
        </section>

        {/* Net Price by Income Section */}
        {(college.net_price_by_income || college.tuition) && (
          <section className="glass-card p-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Scale size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Net Price by Income</h2>
            </div>
            <p className="text-slate-500 mb-10 italic">Actual cost after scholarships and grants.</p>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                {[
                  { range: '$0 - $30k', sub: 'Lowest income', value: college.net_price_by_income?.['0_30000'] },
                  { range: '$30k - $48k', sub: 'Low-middle', value: college.net_price_by_income?.['30001_48000'] },
                  { range: '$48k - $75k', sub: 'Middle income', value: college.net_price_by_income?.['48001_75000'] },
                  { range: '$75k - $110k', sub: 'Upper-middle', value: college.net_price_by_income?.['75001_110000'] }
                ].map((price, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-white/40 rounded-3xl border border-white group hover:bg-white/80 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 tracking-tight">{price.range}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{price.sub}</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">
                      {price.value !== null ? formatTuition(price.value ?? null) : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col justify-center">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <DollarSign size={80} className="text-white" />
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">Full Sticker Price</p>
                  <p className="text-5xl font-black text-white tracking-tighter relative z-10">{formatTuition(college.tuition)}</p>
                  <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Most families pay significantly less than the sticker price thanks to institutional aid and federal grants.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Top Programs Section */}
        {programs && programs.length > 0 && (
          <section className="glass-card p-10 overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top Programs by Salary</h2>
            </div>

            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-slate-400">
                    <th className="py-2 px-6 text-[10px] font-black uppercase tracking-widest">Program / Major</th>
                    <th className="py-2 px-6 text-[10px] font-black uppercase tracking-widest text-right">Median Salary</th>
                    <th className="py-2 px-6 text-[10px] font-black uppercase tracking-widest text-right">Median Debt</th>
                  </tr>
                </thead>
                <tbody className="space-y-4">
                  {programs.slice(0, 10).map((program: any) => (
                    <tr key={`${program.institution_id}-${program.cip_code}-${program.credential_level}`} className="bg-white/40 hover:bg-white/80 transition-colors group">
                      <td className="py-4 px-6 rounded-l-3xl border-l border-t border-b border-white">
                        <p className="font-bold text-slate-800 tracking-tight">{program.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{program.credential_title}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-indigo-600 border-t border-b border-white">
                        {formatEarnings(program.median_earnings)}
                      </td>
                      <td className="py-4 px-6 rounded-r-3xl text-right text-slate-500 border-r border-t border-b border-white">
                        {program.median_debt ? formatTuition(program.median_debt) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Demographics Section */}
        {college.demographics && (
          <section className="glass-card p-10 overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Users size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student Body</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-16">
              {/* Gender Breakdown */}
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Diversity / Gender</h3>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
                      W
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                      M
                    </span>
                  </div>
                </div>
                <div className="flex bg-slate-100 rounded-3xl h-10 p-1.5 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-teal-500 h-full rounded-2xl flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                    style={{ width: `${(college.demographics.women || 0.5) * 100}%` }}
                  >
                    {formatRate(college.demographics.women)}
                  </div>
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-2xl flex items-center justify-center text-[10px] font-black text-white shadow-sm ml-1"
                    style={{ width: `${(college.demographics.men || 0.5) * 100}%` }}
                  >
                    {formatRate(college.demographics.men)}
                  </div>
                </div>
              </div>

              {/* Race/Ethnicity Breakdown */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest text-right">Race & Ethnicity</h3>
                <div className="space-y-4">
                  {[
                    { label: 'White', value: college.demographics.white, color: 'bg-slate-400' },
                    { label: 'Hispanic', value: college.demographics.hispanic, color: 'bg-indigo-400' },
                    { label: 'Black', value: college.demographics.black, color: 'bg-slate-800' },
                    { label: 'Asian', value: college.demographics.asian, color: 'bg-teal-500' },
                    { label: 'International', value: college.demographics.non_resident_alien, color: 'bg-amber-500' }
                  ]
                    .filter(d => d.value && d.value > 0.01)
                    .sort((a, b) => b.value - a.value)
                    .map(demo => (
                      <div key={demo.label} className="flex items-center gap-4 group/row">
                        <div className="w-24 text-[10px] font-black text-slate-400 uppercase tracking-wider">{demo.label}</div>
                        <div className="flex-1 bg-slate-50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`${demo.color} h-full rounded-full transition-all group-hover/row:h-2`}
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

        {/* Student Experiences (Crowdsourced Data) */}
        <StudentExperiences institutionId={parseInt(collegeId)} institutionName={college.name} />

        {/* Outcomes Section */}
        <section className="glass-card p-10 relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Award size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Long-term Outcomes</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Median Salary', value: formatEarnings(college.median_earnings), sub: '10 years post-entry', icon: DollarSign },
              { label: 'Graduation Rate', value: formatRate(college.graduation_rate), sub: 'within 6 years', icon: GraduationCap },
              { label: 'Retention Rate', value: formatRate(college.retention_rate), sub: 'freshman to soph', icon: Users },
              { label: 'Employment', value: 'N/A', sub: 'within 2 years', icon: Briefcase }
            ].map((stat, i) => (
              <div key={i} className="text-center group/stat">
                <div className="w-14 h-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-500 mx-auto mb-4 group-hover/stat:rotate-12 transition-transform">
                  <stat.icon size={28} />
                </div>
                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                <p className="text-[10px] text-slate-400 italic mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Campus Safety Section */}
        {college.crime_stats && (
          <section className="glass-card p-10 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <Shield size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Campus Safety</h2>
              </div>
              <span className="badge bg-rose-50 text-rose-600 border border-rose-100 font-black">
                Latest 3-Year Audit
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { label: 'Total Incidents', value: college.crime_stats.total_incidents, icon: AlertTriangle },
                { label: 'Burglary', value: college.crime_stats.burglary, icon: Shield },
                { label: 'Vehicle Theft', value: college.crime_stats.motor_vehicle_theft, icon: Building2 },
                { label: 'Assault', value: college.crime_stats.aggravated_assault, icon: Info }
              ].map((crime, i) => (
                <div key={i} className="bg-white/40 p-6 rounded-3xl border border-white text-center hover:scale-105 transition-transform">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{crime.label}</p>
                  <p className="text-4xl font-black text-slate-800 leading-none">{crime.value ?? 0}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 px-6 py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              {[
                { label: 'Robbery', val: college.crime_stats.robbery },
                { label: 'Rape', val: college.crime_stats.rape },
                { label: 'Arson', val: college.crime_stats.arson },
                { label: 'Murder', val: college.crime_stats.murder }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}:</span>
                  <span className="text-sm font-black text-slate-700">{item.val ?? 0}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Local City Insights (External Data) */}
        <LocalStatistics
          cityName={college.city}
          cityCrimeStats={college.city_crime_stats}
          localHousingStats={college.local_housing_stats}
          campusCrimeStats={college.crime_stats}
        />

        {/* Quick Facts */}
        <section className="glass-card p-10 border-indigo-50">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Info size={24} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Quick Facts</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { label: 'Location', value: `${college.city}, ${college.state}` },
              { label: 'Type', value: college.type },
              { label: 'In-State Tuition', value: formatTuition(college.tuition) },
              { label: 'Admission Rate', value: formatRate(college.admission_rate) }
            ].map((fact, i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fact.label}</span>
                <span className="font-bold text-slate-800">{fact.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 pt-10">
          <Link href="/search" className="flex-1 h-16 rounded-3xl flex items-center justify-center font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">
            ← Back to Search
          </Link>
          <Link href={`/compare?colleges=${collegeId}`} className="flex-1 h-16 rounded-3xl flex items-center justify-center font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all shadow-lg">
            Compare This College
          </Link>
        </div>
      </div>
    </div>
  );
}
