"use client";

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
            <section className="card p-8 bg-slate-50 border-dashed border-2 border-slate-200">
                <div className="text-center py-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Local City Insights</h3>
                    <p className="text-slate-500 text-sm">
                        We are currently gathering city-level crime and housing data for <span className="font-semibold">{cityName}</span>.
                        Check back soon for "Campus vs. City" comparisons!
                    </p>
                </div>
            </section>
        );
    }

    return (
        <div className="space-y-8">
            {/* City Safety Comparison */}
            {hasCrimeData && (
                <section className="card p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Campus vs. City Safety</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase">Per 100k Residents</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Violent Crime */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Violent Crime Rate</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">On-Campus</span>
                                        <span className="font-bold text-slate-800">{(campusCrimeStats?.violent_rate || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((campusCrimeStats?.violent_rate || 0) / 10, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">{cityName} (City-wide)</span>
                                        <span className="font-bold text-slate-800">{(cityCrimeStats?.violent_rate || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((cityCrimeStats?.violent_rate || 0) / 10, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Crime */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Property Crime Rate</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">On-Campus</span>
                                        <span className="font-bold text-slate-800">{(campusCrimeStats?.property_rate || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((campusCrimeStats?.property_rate || 0) / 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">{cityName} (City-wide)</span>
                                        <span className="font-bold text-slate-800">{(cityCrimeStats?.property_rate || 0).toFixed(1)}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((cityCrimeStats?.property_rate || 0) / 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 italic">
                        * City-wide data sourced from FBI Uniform Crime Reporting (UCR) Program. Rates are estimates.
                    </p>
                </section>
            )}

            {/* Local Housing Cost */}
            {hasHousingData && (
                <section className="card p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Local Housing Markets</h2>
                    <p className="text-slate-500 mb-8 max-w-2xl">
                        HUD Fair Market Rents for the <span className="font-semibold">{cityName}</span> area.
                        Useful for planning off-campus living costs.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Studio</p>
                            <p className="text-2xl font-bold text-slate-800">${localHousingStats.br0?.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">1 Bedroom</p>
                            <p className="text-2xl font-bold text-slate-800">${localHousingStats.br1?.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">2 Bedrooms</p>
                            <p className="text-2xl font-bold text-slate-800">${localHousingStats.br2?.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">3 Bedrooms</p>
                            <p className="text-2xl font-bold text-slate-800">${localHousingStats.br3?.toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 italic">
                        * Data sourced from HUD Fair Market Rent (FMR) API. Prices represent monthly gross rent estimates.
                    </p>
                </section>
            )}
        </div>
    );
}
