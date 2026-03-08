"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import ContributorModal from './ContributorModal';

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

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl"></div>;

    return (
        <section className="card p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Student Contributions</h2>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Community-reported data from actual students.
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        Contribute Data
                    </button>
                )}
            </div>

            {contributions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border-dashed border-2 border-slate-200 rounded-xl">
                    <p className="text-slate-500 italic">No community data yet. Be the first to contribute!</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {contributions.map((contribution) => (
                        <div key={contribution.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                                        {formatDataType(contribution.data_type)}
                                    </span>
                                    <p className="text-xl font-bold text-slate-800">
                                        {contribution.data_type.includes('size') ? contribution.value : `$${contribution.value.toLocaleString()}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-800">{contribution.user_profiles?.display_name || 'Anonymous'}</p>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold uppercase">
                                        {contribution.user_profiles?.reputation_level || 'Novice'}
                                    </span>
                                </div>
                            </div>
                            {contribution.description && (
                                <p className="text-sm text-slate-600 mt-2 italic leading-snug">
                                    "{contribution.description}"
                                </p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${contribution.verification_status === 'verified'
                                        ? 'bg-green-100 text-green-700'
                                        : contribution.votes >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {contribution.verification_status === 'verified' || (contribution.votes >= 3) ? 'COMMUNITY VERIFIED' : 'PENDING'}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(contribution.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400">{contribution.votes || 0}</span>
                                    {isAuthenticated && user?.id !== contribution.user_id && (
                                        <button
                                            onClick={() => handleVote(contribution.id)}
                                            className="p-1 hover:bg-slate-100 rounded-full transition-colors group"
                                            title="Vouch for this data"
                                        >
                                            <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
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
