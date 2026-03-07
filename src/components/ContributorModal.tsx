"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ContributorModalProps {
    isOpen: boolean;
    onClose: () => void;
    institutionId: number;
    institutionName: string;
    onSuccess: () => void;
}

export default function ContributorModal({ isOpen, onClose, institutionId, institutionName, onSuccess }: ContributorModalProps) {
    const { user } = useAuth();
    const [dataType, setDataType] = useState('actual_tuition');
    const [value, setValue] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/contributions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    institution_id: institutionId,
                    data_type: dataType,
                    value: parseFloat(value),
                    description,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit contribution');
            }

            onSuccess();
            onClose();
            setValue('');
            setDescription('');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeInScale">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Contribute Data</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Help the community by sharing the real costs for <span className="font-semibold text-slate-700">{institutionName}</span>.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">What are you reporting?</label>
                        <select
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="actual_tuition">Actual Tuition Paid (Annual)</option>
                            <option value="housing_cost">Housing/Rent (Monthly)</option>
                            <option value="book_cost">Books & Supplies (Annual)</option>
                            <option value="class_size">Average Class Size</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount / Value</label>
                        <div className="relative">
                            {dataType !== 'class_size' && (
                                <span className="absolute left-4 top-2 text-slate-400">$</span>
                            )}
                            <input
                                type="number"
                                required
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={dataType === 'class_size' ? "e.g. 25" : "0.00"}
                                className={`w-full ${dataType !== 'class_size' ? 'pl-8' : 'pl-4'} pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Any details to help verify this?"
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Submit'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-slate-400">
                            Earn <span className="text-teal-600 font-bold">+10 points</span> for this contribution!
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
