import { Metadata } from 'next';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { MapPin, GraduationCap, DollarSign, ArrowRight, Building2 } from 'lucide-react';

// Map of URL-friendly state names to state codes and display names
const STATE_MAP: Record<string, { code: string; name: string }> = {
    alabama: { code: 'AL', name: 'Alabama' },
    alaska: { code: 'AK', name: 'Alaska' },
    arizona: { code: 'AZ', name: 'Arizona' },
    arkansas: { code: 'AR', name: 'Arkansas' },
    california: { code: 'CA', name: 'California' },
    colorado: { code: 'CO', name: 'Colorado' },
    connecticut: { code: 'CT', name: 'Connecticut' },
    delaware: { code: 'DE', name: 'Delaware' },
    florida: { code: 'FL', name: 'Florida' },
    georgia: { code: 'GA', name: 'Georgia' },
    hawaii: { code: 'HI', name: 'Hawaii' },
    idaho: { code: 'ID', name: 'Idaho' },
    illinois: { code: 'IL', name: 'Illinois' },
    indiana: { code: 'IN', name: 'Indiana' },
    iowa: { code: 'IA', name: 'Iowa' },
    kansas: { code: 'KS', name: 'Kansas' },
    kentucky: { code: 'KY', name: 'Kentucky' },
    louisiana: { code: 'LA', name: 'Louisiana' },
    maine: { code: 'ME', name: 'Maine' },
    maryland: { code: 'MD', name: 'Maryland' },
    massachusetts: { code: 'MA', name: 'Massachusetts' },
    michigan: { code: 'MI', name: 'Michigan' },
    minnesota: { code: 'MN', name: 'Minnesota' },
    mississippi: { code: 'MS', name: 'Mississippi' },
    missouri: { code: 'MO', name: 'Missouri' },
    montana: { code: 'MT', name: 'Montana' },
    nebraska: { code: 'NE', name: 'Nebraska' },
    nevada: { code: 'NV', name: 'Nevada' },
    'new-hampshire': { code: 'NH', name: 'New Hampshire' },
    'new-jersey': { code: 'NJ', name: 'New Jersey' },
    'new-mexico': { code: 'NM', name: 'New Mexico' },
    'new-york': { code: 'NY', name: 'New York' },
    'north-carolina': { code: 'NC', name: 'North Carolina' },
    'north-dakota': { code: 'ND', name: 'North Dakota' },
    ohio: { code: 'OH', name: 'Ohio' },
    oklahoma: { code: 'OK', name: 'Oklahoma' },
    oregon: { code: 'OR', name: 'Oregon' },
    pennsylvania: { code: 'PA', name: 'Pennsylvania' },
    'rhode-island': { code: 'RI', name: 'Rhode Island' },
    'south-carolina': { code: 'SC', name: 'South Carolina' },
    'south-dakota': { code: 'SD', name: 'South Dakota' },
    tennessee: { code: 'TN', name: 'Tennessee' },
    texas: { code: 'TX', name: 'Texas' },
    utah: { code: 'UT', name: 'Utah' },
    vermont: { code: 'VT', name: 'Vermont' },
    virginia: { code: 'VA', name: 'Virginia' },
    washington: { code: 'WA', name: 'Washington' },
    'west-virginia': { code: 'WV', name: 'West Virginia' },
    wisconsin: { code: 'WI', name: 'Wisconsin' },
    wyoming: { code: 'WY', name: 'Wyoming' },
};

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
}

async function getCollegesForState(stateCode: string): Promise<{ colleges: College[]; total: number }> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.gradetograd.com';
        const res = await fetch(`${baseUrl}/api/colleges?state=${stateCode}&limit=100`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return { colleges: [], total: 0 };
        const data = await res.json();
        return { colleges: data.colleges || [], total: data.total || 0 };
    } catch {
        return { colleges: [], total: 0 };
    }
}

export async function generateStaticParams() {
    return Object.keys(STATE_MAP).map((state) => ({ state }));
}

export async function generateMetadata({
    params: paramsPromise,
}: {
    params: Promise<{ state: string }>;
}): Promise<Metadata> {
    const params = await paramsPromise;
    const stateInfo = STATE_MAP[params.state];
    if (!stateInfo) return constructMetadata({ noIndex: true });

    const baseUrl = 'https://www.gradetograd.com';
    const pageUrl = `${baseUrl}/colleges/${params.state}`;

    return {
        title: `Colleges in ${stateInfo.name} — Tuition, Acceptance Rates & Outcomes`,
        description: `Browse all colleges and universities in ${stateInfo.name}. Compare tuition costs, acceptance rates, graduation rates, and career outcomes to find your perfect college path.`,
        alternates: {
            canonical: pageUrl,
            languages: {
                'en-US': pageUrl,
            },
        },
        openGraph: {
            title: `Colleges in ${stateInfo.name} — Tuition, Acceptance Rates & Outcomes`,
            description: `Browse ${stateInfo.name} colleges and universities. Compare tuition, acceptance rates, graduation rates, and career outcomes.`,
            url: pageUrl,
            siteName: 'CollegePath',
            type: 'website',
            locale: 'en_US',
            images: [
                {
                    url: `${baseUrl}/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: `Colleges in ${stateInfo.name}`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `Colleges in ${stateInfo.name}`,
            description: `Browse ${stateInfo.name} colleges and universities.`,
        },
    };
}

export default async function StateCollegePage({
    params: paramsPromise,
}: {
    params: Promise<{ state: string }>;
}) {
    const params = await paramsPromise;
    const stateInfo = STATE_MAP[params.state];
    if (!stateInfo) notFound();

    const { colleges, total } = await getCollegesForState(stateInfo.code);

    const formatTuition = (t: number | null) => (t ? `$${t.toLocaleString()}` : 'N/A');
    const formatRate = (r: number | null) => (r ? `${r.toFixed(1)}%` : 'N/A');

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero */}
            <section className="relative pt-24 pb-20 px-6 overflow-hidden bg-white border-b border-slate-100">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[100%] bg-indigo-500/5 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[100%] bg-teal-500/5 blur-[100px] rounded-full" />
                </div>
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/search" className="hover:text-indigo-600 transition-colors">Colleges</Link>
                        <span>/</span>
                        <span className="text-indigo-600">{stateInfo.name}</span>
                    </nav>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            {stateInfo.code}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95] mb-4">
                        Colleges in<br />
                        <span className="text-indigo-600">{stateInfo.name}</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl">
                        Explore <span className="font-bold text-slate-700">{total} institutions</span> in {stateInfo.name}.
                        Compare tuition, acceptance rates, graduation outcomes, and career earnings.
                    </p>
                </div>
            </section>

            {/* College Grid */}
            <section className="max-w-7xl mx-auto px-6 py-16">
                {colleges.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-xl font-bold">No colleges found for {stateInfo.name}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {colleges.map((college, index) => (
                            <Link
                                key={college.id}
                                href={`/college/${college.id}`}
                                className="glass-card p-8 group hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1 animate-fadeInUp"
                                style={{ animationDelay: `${Math.min(index * 30, 500)}ms` }}
                            >
                                <div className="mb-5">
                                    <h2 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight mb-2">
                                        {college.name}
                                    </h2>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <MapPin size={10} className="text-indigo-400" />
                                        {college.city}, {stateInfo.code}
                                    </div>
                                </div>

                                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100/50 mb-5">
                                    {college.type}
                                </span>

                                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <DollarSign size={10} className="text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tuition</span>
                                        </div>
                                        <p className="font-black text-slate-800 text-sm">{formatTuition(college.tuition)}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <GraduationCap size={10} className="text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Grad</span>
                                        </div>
                                        <p className="font-black text-teal-600 text-sm">{formatRate(college.graduation_rate)}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Building2 size={10} className="text-slate-400" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Admit</span>
                                        </div>
                                        <p className="font-black text-slate-800 text-sm">{formatRate(college.admission_rate)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                                    <span>View Profile</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
                <div className="bg-slate-900 rounded-[2.5rem] p-12 text-center">
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Looking beyond {stateInfo.name}?</h2>
                    <p className="text-slate-400 mb-8 font-medium">Search all colleges nationwide by type, tuition, and outcomes.</p>
                    <Link href="/search" className="inline-flex items-center gap-3 h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-900/50 hover:scale-105 transition-all">
                        Explore All Colleges
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
