import Link from 'next/link';
import { RefreshCcw, GraduationCap, ArrowRight, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Transfer Pathways — Coming Soon | CollegePath',
  description: 'Seamlessly bridge the gap between community college and your dream university. Transfer Pathway Explorer is coming soon.',
};

const upcomingFeatures = [
  {
    icon: BookOpen,
    title: 'Articulation Agreements',
    desc: 'Browse thousands of official credit transfer agreements between community colleges and 4-year universities.',
  },
  {
    icon: ShieldCheck,
    title: 'Credit Preservation',
    desc: 'Know exactly which credits transfer before you enroll — no surprises, no wasted tuition.',
  },
  {
    icon: GraduationCap,
    title: 'Pathway Planning',
    desc: "Map your full 2+2 degree path from associate to bachelor's with a personalized roadmap.",
  },
];

export default function TransferPathwaysComingSoon() {
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Hero */}
      <section className="relative pt-24 pb-32 px-4 overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 to-slate-50 opacity-60" />
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-[120px]" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mb-8">
            <Sparkles size={14} strokeWidth={3} />
            Coming Soon
          </div>

          {/* Icon */}
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-slate-200 relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <RefreshCcw size={40} strokeWidth={2} className="text-white relative z-10" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
            Transfer Pathway <br />
            <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Explorer
            </span>
          </h1>

          <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed font-medium mb-12">
            We&apos;re building a comprehensive database of official articulation agreements so you can plan your 2+2 transfer journey with confidence.
          </p>

          <Link
            href="/search"
            className="inline-flex items-center gap-3 h-14 px-10 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all"
          >
            Explore Colleges Now
            <ArrowRight size={16} />
          </Link>

          <p className="mt-5 text-xs text-slate-400 font-bold uppercase tracking-widest">
            Search 7,000+ colleges while you wait
          </p>
        </div>
      </section>

      {/* Upcoming Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32 -mt-8">
        <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-10">
          What&apos;s coming
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {upcomingFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <feature.icon size={22} />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA strip */}
      <section className="bg-slate-900 py-20 px-6 text-center">
        <h2 className="text-3xl font-black text-white tracking-tighter mb-4">
          Ready to find your college?
        </h2>
        <p className="text-indigo-200/60 font-medium mb-8 max-w-md mx-auto">
          While Transfer Pathways is in development, you can already search and compare thousands of colleges.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-3 h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
        >
          Start Exploring
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
