"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getCommunityColleges, getTransferUniversities, searchTransferPathways } from '@/lib/supabase-client';
import { RefreshCcw, GraduationCap, Search, ArrowRight, BookOpen, ShieldCheck, MapPin, Building2, ChevronRight, Info } from 'lucide-react';

interface TransferPathway {
  id: string;
  source_institution_id: number;
  target_institution_id: number;
  agreement_type: string;
  requirements: string;
  program: string;
  source?: any;
  target?: any;
}

export default function TransferPathwaysPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [pathways, setPathways] = useState<TransferPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeType, setCollegeType] = useState<'cc' | 'university'>('cc');
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadColleges() {
      setLoading(true);

      try {
        let result;
        if (collegeType === 'cc') {
          result = await getCommunityColleges();
        } else {
          result = await getTransferUniversities();
        }

        if (result.error) {
          setError('Failed to load colleges');
        } else {
          setColleges(result.data || []);
        }
      } catch (err) {
        setError('Failed to load colleges');
      } finally {
        setLoading(false);
      }
    }

    loadColleges();
  }, [collegeType]);

  const handleCollegeSelect = async (college: any) => {
    setSelectedCollege(college);
    setPathwayLoading(true);

    try {
      const result = await searchTransferPathways(
        college.id,
        collegeType === 'cc' ? 'source' : 'target'
      );

      if (result.error) {
        setError('Failed to load transfer pathways');
      } else {
        setPathways(result.data || []);
      }
    } catch (err) {
      setError('Failed to load transfer pathways');
    } finally {
      setPathwayLoading(false);
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full gradient-primary opacity-5"></div>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-8">
            <RefreshCcw size={14} strokeWidth={3} className="animate-spin-slow" />
            Pathkeeper Intelligence
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
            Transfer Pathway <br /><span className="text-gradient">Explorer</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Seamlessly bridge the gap between community college and your dream university with our AI-powered agreement database.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-16 pb-24">
        {/* Type Toggle */}
        <div className="flex justify-center mb-16 px-4">
          <div className="bg-white/80 backdrop-blur-xl border border-white p-2 rounded-[2rem] shadow-2xl flex gap-1 sm:gap-4">
            <button
              onClick={() => { setCollegeType('cc'); setSelectedCollege(null); setPathways([]); }}
              className={`px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${collegeType === 'cc'
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              🚀 Starting Point
            </button>
            <div className="w-10 h-10 self-center rounded-full bg-slate-100 flex items-center justify-center text-slate-400 rotate-90 sm:rotate-0">
              <ArrowRight size={20} />
            </div>
            <button
              onClick={() => { setCollegeType('university'); setSelectedCollege(null); setPathways([]); }}
              className={`px-8 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${collegeType === 'university'
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              🎓 Target School
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 px-2 sm:px-4">
          {/* College Selection List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card-elevated p-10 border-none shadow-xl shadow-slate-100/50">
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Building2 size={20} />
                </div>
                {collegeType === 'cc' ? 'Current College' : 'Future University'}
              </h2>

              <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or location..."
                  className="w-full pl-14 pr-6 py-5 bg-slate-50/50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-premium">
                  {filteredColleges.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl">
                      <p className="text-slate-400 font-bold italic">No matching institutions</p>
                    </div>
                  ) : (
                    filteredColleges.slice(0, 50).map((college) => (
                      <button
                        key={college.id}
                        onClick={() => handleCollegeSelect(college)}
                        className={`w-full text-left p-6 rounded-[1.5rem] transition-all group relative overflow-hidden ${selectedCollege?.id === college.id
                          ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-indigo-100'
                          }`}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <p className={`font-black tracking-tight text-lg mb-1 ${selectedCollege?.id === college.id ? 'text-white' : 'text-slate-900'}`}>{college.name}</p>
                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${selectedCollege?.id === college.id ? 'text-slate-400' : 'text-slate-500'}`}>
                              <MapPin size={12} />
                              {college.city}, {college.state}
                            </div>
                          </div>
                          <ChevronRight size={20} className={`transition-all ${selectedCollege?.id === college.id ? 'text-indigo-400 translate-x-1' : 'text-slate-300 group-hover:text-indigo-500'}`} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Transfer Pathways Results View */}
          <div className="lg:col-span-3">
            <div className="glass-card-elevated p-10 border-none min-h-[500px] relative overflow-hidden bg-white/40">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <BookOpen size={200} />
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedCollege
                      ? `Pathways for ${selectedCollege.name}`
                      : 'Opportunity Discovery'}
                  </h2>
                  {pathways.length > 0 && (
                    <span className="h-8 px-4 bg-emerald-50 text-emerald-600 rounded-full flex items-center text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                      {pathways.length} Agreements
                    </span>
                  )}
                </div>

                {!selectedCollege ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-indigo-200">
                      <Search size={48} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-3 tracking-tighter italic">Select an institution to begin</p>
                    <p className="text-slate-400 max-w-sm font-medium">Choose a {collegeType === 'cc' ? 'community college' : 'university'} from the left to visualize available credit transfer agreements.</p>
                  </div>
                ) : pathwayLoading ? (
                  <div className="flex-1 flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                ) : pathways.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-red-200">
                      <Info size={48} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">No agreements on file</p>
                    <p className="text-slate-400 max-w-sm font-medium leading-relaxed">We&apos;re currently updating our database for {selectedCollege.name}. Formal agreements may still exist directly on the institution's portal.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pathways.map((pathway) => (
                      <div
                        key={pathway.id}
                        className="p-8 bg-white border border-slate-100 rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-50 transition-all group/item"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover/item:text-indigo-600 transition-colors">
                                {collegeType === 'cc' ? pathway.target?.name : pathway.source?.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                                <MapPin size={12} />
                                {collegeType === 'cc'
                                  ? `${pathway.target?.city}, ${pathway.target?.state}`
                                  : `${pathway.source?.city}, ${pathway.source?.state}`
                                }
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <span className={`h-8 px-4 flex items-center text-[9px] font-black uppercase tracking-widest rounded-lg border ${pathway.agreement_type === 'automatic'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                }`}>
                                {pathway.agreement_type || 'Pathway'} Agreement
                              </span>
                              {pathway.program && (
                                <span className="h-8 px-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                                  <BookOpen size={10} />
                                  {pathway.program}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/college/${collegeType === 'cc' ? pathway.target_institution_id : pathway.source_institution_id}`}
                            className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all shadow-sm"
                          >
                            <ArrowRight size={24} />
                          </Link>
                        </div>

                        {pathway.requirements && (
                          <div className="mt-8 pt-6 border-t border-slate-50">
                            <div className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <ShieldCheck size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Transfer conditions</span>
                                {pathway.requirements}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informational Methodology */}
        <div className="mt-24 px-4">
          <div className="glass-card p-12 md:p-16 border-none shadow-2xl relative overflow-hidden bg-slate-900">
            <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none text-white">
              <RefreshCcw size={160} />
            </div>

            <h2 className="text-4xl font-black text-white mb-12 tracking-tighter relative z-10">Optimizing your <span className="text-indigo-400">Educational Credits</span></h2>

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {[
                {
                  title: 'Credit Preservation',
                  desc: 'Formal articulation agreements ensure your hard-earned community college credits transfer at maximum value, preventing redundant coursework.',
                  num: '01'
                },
                {
                  title: 'Strategic Planning',
                  desc: 'Identifying your target university early allows you to align your associate degree curriculum with specific bachelor degree requirements.',
                  num: '02'
                },
                {
                  title: 'Cost Neutrality',
                  desc: 'Leveraging pathways can reduce the total cost of a degree by up to 60% while maintaining the prestige of the final university credential.',
                  num: '03'
                }
              ].map((step, idx) => (
                <div key={idx} className="space-y-6 group">
                  <div className="text-6xl font-black text-indigo-500/20 group-hover:text-indigo-500 transition-colors duration-500 leading-none">{step.num}</div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{step.title}</h3>
                  <p className="text-indigo-100/60 text-sm leading-relaxed font-medium transition-colors group-hover:text-indigo-100">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
