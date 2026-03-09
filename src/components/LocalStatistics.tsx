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
        <div className="space-y-16 py-12">
            {/* City Safety Comparison */}
            {hasCrimeData && (
                <section className="glass-card-elevated p-10 relative overflow-hidden group border-none shadow-2xl shadow-indigo-100/20">
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-50/30 rounded-full blur-[100px] group-hover:bg-indigo-100/40 transition-colors duration-700"></div>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                        <ShieldCheck size={160} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-10 border-b border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                <ShieldCheck size={32} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Security Benchmark</h2>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Campus vs. City Comparison (Per 100k)</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-20">
                        <CrimeGauge
                            label="Violent Offenses"
                            campusValue={campusCrimeStats?.violent_rate}
                            cityValue={cityCrimeStats?.violent_rate}
                            max={15}
                        />
                        <CrimeGauge
                            label="Property Crimes"
                            campusValue={campusCrimeStats?.property_rate}
                            cityValue={cityCrimeStats?.property_rate}
                            max={200}
                        />
                    </div>

                    <div className="mt-12 flex items-start gap-4 bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-500 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                            Stats sourced from institutional reports and municipal data. These rates provide a standardized baseline for comparing safety across different environments.
                        </p>
                    </div>
                </section>
            )}

            {/* Local Housing Cost */}
            {hasHousingData && (
                <section className="glass-card p-10 relative overflow-hidden group border-none shadow-xl shadow-slate-100/50">
                    <div className="absolute -left-20 -top-20 w-80 h-80 bg-teal-50/30 rounded-full blur-[100px] group-hover:bg-teal-100/40 transition-colors duration-700"></div>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                        <Home size={160} />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-10 border-b border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-sm">
                                <Home size={32} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Living In {cityName}</h2>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Off-Campus Market Estimator</p>
                            </div>
                        </div>
                        <div className="h-10 px-6 bg-teal-50 text-teal-700 border border-teal-100 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-sm shadow-teal-50">
                            <TrendingUp size={14} strokeWidth={3} />
                            Current Fair Market Rents
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Studio', value: localHousingStats.br0, icon: '🏠', color: 'from-teal-400 to-teal-500' },
                            { label: '1 Bedroom', value: localHousingStats.br1, icon: '🏢', color: 'from-indigo-400 to-indigo-500' },
                            { label: '2 Bedrooms', value: localHousingStats.br2, icon: '🏘️', color: 'from-emerald-400 to-emerald-500' },
                            { label: '3 Bedrooms', value: localHousingStats.br3, icon: '🏢', color: 'from-sky-400 to-sky-500' }
                        ].map((item, idx) => (
                            <div key={idx} className="group/item relative p-8 bg-white/40 hover:bg-white rounded-[2.5rem] border border-white hover:border-teal-100 hover:shadow-2xl hover:shadow-teal-100/20 hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center">
                                <div className="text-3xl mb-4 group-hover/item:scale-125 transition-transform duration-500">{item.icon}</div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{item.label}</p>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">${item.value?.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Monthly Average</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                            <Info size={18} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                            Data provided by HUD Fair Market Rent (FMR). These estimates assist with financial planning for off-campus housing in the {cityName} metropolitan area.
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
}
