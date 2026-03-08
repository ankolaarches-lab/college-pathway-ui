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
        <section className="glass-card p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <MessageSquare size={120} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-slate-100/50">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Experiences</h2>
                    <p className="text-slate-500 text-sm mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Community-reported insights from actual students.
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary group"
                    >
                        <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                        Contribute Data
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
                <div className="grid xl:grid-cols-2 gap-6">
                    {contributions.map((contribution) => {
                        const isVerified = contribution.verification_status === 'verified' || contribution.votes >= 3;
                        return (
                            <div key={contribution.id} className="glass-card-elevated p-6 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-50 transition-all group/item border border-white">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                {formatDataType(contribution.data_type)}
                                            </span>
                                            <p className="text-3xl font-black text-slate-800">
                                                {contribution.data_type.includes('size') ? contribution.value : `$${contribution.value.toLocaleString()}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 text-right">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-slate-800">{contribution.user_profiles?.display_name || 'Anonymous'}</p>
                                                <span className="badge badge-vibrant scale-90 origin-right">
                                                    {contribution.user_profiles?.reputation_level || 'Novice'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <User fill="currentColor" size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {contribution.description && (
                                        <div className="bg-slate-50/80 rounded-2xl p-4 mb-6 relative">
                                            <div className="absolute -left-1 top-4 w-1 h-8 bg-indigo-200 rounded-full"></div>
                                            <p className="text-sm text-slate-600 leading-relaxed indent-2 italic">
                                                "{contribution.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        {isVerified ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] tracking-tighter bg-emerald-50 px-2.5 py-1 rounded-full">
                                                <ShieldCheck size={12} strokeWidth={3} />
                                                COMMUNITY VERIFIED
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] tracking-tighter bg-slate-50 px-2.5 py-1 rounded-full">
                                                <Calendar size={12} strokeWidth={3} />
                                                JUST POSTED
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm group/vouch">
                                            <span className="text-xs font-black text-slate-800 mr-2">{contribution.votes || 0}</span>
                                            {isAuthenticated && user?.id !== contribution.user_id && (
                                                <button
                                                    onClick={() => handleVote(contribution.id)}
                                                    className="text-slate-300 hover:text-indigo-600 transition-colors p-1 -mr-1"
                                                    title="Vouch for this data"
                                                >
                                                    <ThumbsUp size={14} fill={contribution.votes > 0 ? "currentColor" : "none"} />
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
