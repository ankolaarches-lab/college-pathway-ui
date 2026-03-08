"use client";

import { ShieldCheck, Home, Info, AlertTriangle, TrendingUp } from 'lucide-react';

interface LocalStatisticsProps {
    cityCrimeStats?: any;
    localHousingStats?: any;
    campusCrimeStats?: any;
    cityName: string;
}

export default function LocalStatistics({ cityCrimeStats, localHousingStats, campusCrimeStats, cityName }: LocalStatisticsProps) {
    const hasCrimeData = cityCrimeStats && Object.keys(cityCrimeStats).length > 0;
    const hasHousingData = localHousingStats && Object.keys(localHousingStats).length > 0;

    if (!hasCrimeData && !hasHousingData) {
        return (
            <section className="glass-card p-10 border-dashed border-2 border-primary/20 bg-primary/5">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Local City Insights</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                        We are currently gathering city-level crime and housing data for <span className="font-semibold text-primary">{cityName}</span>.
                        Check back soon for "Campus vs. City" comparisons!
                    </p>
                </div>
            </section>
        );
    }

    const CrimeGauge = ({ label, campusValue, cityValue, max = 50, unit = "" }: any) => (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">PER 100K</span>
            </div>

            <div className="space-y-5">
                {/* On Campus */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">On-Campus</span>
                        <span className="font-bold text-indigo-600">{(campusValue || 0).toFixed(1)}{unit}</span>
                    </div>
                    <div className="stat-gauge-track">
                        <div
                            className="stat-gauge-bar bg-gradient-to-r from-indigo-500 to-indigo-400"
                            style={{ width: `${Math.min(((campusValue || 0) / max) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* City Wide */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{cityName} (City-wide)</span>
                        <span className="font-bold text-teal-600">{(cityValue || 0).toFixed(1)}{unit}</span>
                    </div>
                    <div className="stat-gauge-track">
                        <div
                            className="stat-gauge-bar bg-gradient-to-r from-teal-500 to-teal-400"
                            style={{ width: `${Math.min(((cityValue || 0) / max) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 section-blur">
            {/* City Safety Comparison */}
            {hasCrimeData && (
                <section className="glass-card-elevated p-8 md:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={120} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Campus vs. City Safety</h2>
                                <p className="text-sm text-slate-500">Comparative crime rates normalized per 100,000 residents.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16">
                        <CrimeGauge
                            label="Violent Crime Rate"
                            campusValue={campusCrimeStats?.violent_rate}
                            cityValue={cityCrimeStats?.violent_rate}
                            max={15}
                        />
                        <CrimeGauge
                            label="Property Crime Rate"
                            campusValue={campusCrimeStats?.property_rate}
                            cityValue={cityCrimeStats?.property_rate}
                            max={200}
                        />
                    </div>

                    <div className="mt-10 flex items-start gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                        <AlertTriangle className="w-4 h-4 text-indigo-400 mt-0.5" />
                        <p className="text-[11px] text-indigo-900/60 leading-relaxed italic">
                            Stats sourced from FBI Uniform Crime Reporting (UCR). These rates are based on agency reports and population estimates to provide a standard baseline for comparison.
                        </p>
                    </div>
                </section>
            )}

            {/* Local Housing Cost */}
            {hasHousingData && (
                <section className="glass-card p-8 md:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Home size={120} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                                <Home size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 text-gradient">Local Housing Market</h2>
                                <p className="text-sm text-slate-500">HUD Fair Market Rents for planning off-campus living.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-teal-50 px-3 py-1 rounded-full text-teal-700 text-xs font-bold uppercase tracking-wider">
                            <TrendingUp size={12} />
                            2024 Estimates
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Studio', value: localHousingStats.br0 },
                            { label: '1 Bedroom', value: localHousingStats.br1 },
                            { label: '2 Bedrooms', value: localHousingStats.br2 },
                            { label: '3 Bedrooms', value: localHousingStats.br3 }
                        ].map((item, idx) => (
                            <div key={idx} className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-lg hover:-translate-y-1 transition-all group/item">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 group-hover/item:text-teal-500 transition-colors">{item.label}</p>
                                <p className="text-3xl font-black text-slate-800">${item.value?.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Per Month</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-8 flex items-center gap-2">
                        <Info size={12} />
                        Data sourced from HUD Fair Market Rent (FMR) API. Prices represent median monthly gross rent estimates for the {cityName} area.
                    </p>
                </section>
            )}
        </div>
    );
}
