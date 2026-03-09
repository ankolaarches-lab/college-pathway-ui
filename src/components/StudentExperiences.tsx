"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import ContributorModal from './ContributorModal';
import { MessageSquare, ThumbsUp, ShieldCheck, User, Calendar, PlusCircle } from 'lucide-react';

interface Contribution {
    id: string;
    data_type: string;
    value: number;
    description: string;
    verification_status: string;
    votes: number;
    created_at: string;
    user_id: string;
    user_profiles: {
        display_name: string;
        reputation_level: string;
    };
}

interface StudentExperiencesProps {
    institutionId: number;
    institutionName: string;
}

export default function StudentExperiences({ institutionId, institutionName }: StudentExperiencesProps) {
    const { isAuthenticated, user } = useAuth();
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchContributions = async () => {
        try {
            const response = await fetch(`/api/contributions?institution_id=${institutionId}`);
            if (response.ok) {
                const data = await response.json();
                setContributions(data);
            }
        } catch (err) {
            console.error('Error fetching contributions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContributions();
    }, [institutionId]);

    const handleVote = async (contributionId: string) => {
        if (!isAuthenticated || !user) return;
        try {
            const response = await fetch('/api/contributions/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contribution_id: contributionId, user_id: user.id })
            });
            if (response.ok) {
                fetchContributions(); // Refresh to show new vote count
            }
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const formatDataType = (type: string) => {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-pulse h-40 bg-slate-100 rounded-3xl"></div>
            <div className="animate-pulse h-40 bg-slate-100 rounded-3xl"></div>
        </div>
    );

    return (
        <section className="glass-card p-10 relative overflow-hidden group border-none">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                <MessageSquare size={160} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 pb-10 border-b border-slate-100">
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Student Voice</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                                    <User size={10} />
                                </div>
                            ))}
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            Verified Insights from actual students
                        </p>
                    </div>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-14 px-8 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                        <PlusCircle size={18} />
                        Share Experience
                    </button>
                )}
            </div>

            {contributions.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 border-dashed border-2 border-slate-200 rounded-3xl">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium italic">No community data yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="grid xl:grid-cols-2 gap-8">
                    {contributions.map((contribution) => {
                        const isVerified = contribution.verification_status === 'verified' || contribution.votes >= 3;
                        return (
                            <div key={contribution.id} className="glass-card-elevated p-8 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500 group/item border border-white/80 bg-white/40">
                                <div>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="space-y-2">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-indigo-100/50">
                                                {formatDataType(contribution.data_type)}
                                            </span>
                                            <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                {contribution.data_type.includes('size') ? contribution.value : `$${contribution.value.toLocaleString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">{contribution.user_profiles?.display_name || 'Anonymous'}</p>
                                                <div className="h-5 px-2 bg-slate-900 text-white text-[8px] font-black uppercase tracking-[0.15em] rounded-md flex items-center justify-center">
                                                    {contribution.user_profiles?.reputation_level || 'Novice'}
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                                                <User size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {contribution.description && (
                                        <div className="bg-white/60 p-6 rounded-[2rem] mb-8 border border-white shadow-sm relative group/quote">
                                            <div className="absolute -left-1 top-6 w-1 h-12 bg-indigo-500 rounded-full group-hover/quote:h-16 transition-all"></div>
                                            <p className="text-base text-slate-600 leading-relaxed font-medium italic pl-2">
                                                "{contribution.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        {isVerified ? (
                                            <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-[9px] tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                                                <ShieldCheck size={14} strokeWidth={3} className="animate-pulse" />
                                                COMMUNITY VERIFIED
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-400 font-extrabold text-[9px] tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                                                <Calendar size={14} strokeWidth={3} />
                                                FRESH INSIGHT
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="h-10 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:border-indigo-200 hover:shadow-md">
                                            <span className="text-sm font-black text-slate-900">{contribution.votes || 0}</span>
                                            {isAuthenticated && user?.id !== contribution.user_id && (
                                                <button
                                                    onClick={() => handleVote(contribution.id)}
                                                    className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:scale-125 transition-all"
                                                    title="Vouch for this data"
                                                >
                                                    <ThumbsUp size={16} fill={contribution.votes > 0 ? "currentColor" : "none"} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ContributorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                institutionId={institutionId}
                institutionName={institutionName}
                onSuccess={fetchContributions}
            />
        </section>
    );
}
