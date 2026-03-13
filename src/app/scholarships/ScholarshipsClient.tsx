'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, Sparkles, DollarSign, Calendar, ChevronRight, Filter, Star } from 'lucide-react';

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount_min: number;
  amount_max: number;
  amount_is_renewable: boolean;
  deadline_month: number;
  deadline_day: number;
  category: string;
  description: string;
  application_url: string;
  is_hidden_gem: boolean;
}

const categories = [
  { id: 'all', label: 'All Scholarships' },
  { id: 'hidden-gem', label: 'Hidden Gems' },
  { id: 'need-based', label: 'Need-Based' },
  { id: 'merit', label: 'Merit' },
  { id: 'passion-based', label: 'Passion-Based' },
  { id: 'demographic', label: 'Demographic' },
  { id: 'field-of-study', label: 'Field of Study' },
  { id: 'creative', label: 'Creative/Unique' },
];

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const categoryColors: Record<string, string> = {
  'need-based': 'bg-blue-100 text-blue-700 border-blue-200',
  'merit': 'bg-purple-100 text-purple-700 border-purple-200',
  'passion-based': 'bg-pink-100 text-pink-700 border-pink-200',
  'demographic': 'bg-amber-100 text-amber-700 border-amber-200',
  'field-of-study': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'creative': 'bg-rose-100 text-rose-700 border-rose-200',
  'employment': 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

function formatUrl(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}utm_source=gradetograd&utm_medium=referral&utm_campaign=scholarships`;
}

function formatAmount(min: number, max: number, renewable: boolean) {
  const format = (n: number) => n.toLocaleString();
  let str = '';
  if (min === max) {
    str = `$${format(max)}`;
  } else {
    str = `$${format(min)} - $${format(max)}`;
  }
  if (renewable) str += '/yr';
  return str;
}

function formatDeadline(month: number, day: number) {
  return `${monthNames[month - 1]} ${day}`;
}

export default function ScholarshipsClient() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    async function fetchScholarships() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeCategory === 'hidden-gem') {
          params.set('hidden_gem', 'true');
        } else if (activeCategory !== 'all') {
          params.set('category', activeCategory);
        }
        
        const res = await fetch(`/api/scholarships?${params}`);
        const data = await res.json();
        setScholarships(data.scholarships || []);
      } catch (err) {
        console.error('Error fetching scholarships:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchScholarships();
  }, [activeCategory]);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[160px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 blur-[160px] rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Funding Opportunities</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Scholarships & <span className="text-gradient">Grants</span>
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover hidden scholarships that most students don't know about. 
            From passion-based awards to need-based grants — find funding for your education.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{scholarships.length}</div>
              <div className="text-sm text-slate-500">Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">
                ${(scholarships.reduce((acc, s) => acc + (s.amount_max || 0), 0) / 1000).toFixed(0)}K+
              </div>
              <div className="text-sm text-slate-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {scholarships.filter(s => s.is_hidden_gem).length}
              </div>
              <div className="text-sm text-slate-500">Hidden Gems</div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 lg:px-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Scholarships Grid */}
      <section className="px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-6 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-6"></div>
                  <div className="h-20 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : scholarships.length === 0 ? (
            <div className="text-center py-16">
              <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No scholarships found</h3>
              <p className="text-slate-500">Try selecting a different category</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map((scholarship) => (
                <a
                  key={scholarship.id}
                  href={formatUrl(scholarship.application_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {scholarship.is_hidden_gem && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mb-2">
                          <Star className="w-3 h-3 fill-current" />
                          Hidden Gem
                        </div>
                      )}
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {scholarship.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{scholarship.provider}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-700">
                        {formatAmount(scholarship.amount_min, scholarship.amount_max, scholarship.amount_is_renewable)}
                      </span>
                    </div>
                    {scholarship.amount_is_renewable && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        Renewable
                      </span>
                    )}
                  </div>

                  {/* Category Tag */}
                  <div className="mb-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                      categoryColors[scholarship.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {scholarship.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {scholarship.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>Due {formatDeadline(scholarship.deadline_month, scholarship.deadline_day)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                      Apply <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card-elevated p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Need help finding the right scholarship?
            </h2>
            <p className="text-slate-600 mb-6 max-w-xl mx-auto">
              Create an account to get personalized scholarship recommendations based on your profile and interests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Search Colleges
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                View My Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
