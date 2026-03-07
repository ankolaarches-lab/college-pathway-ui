"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getCommunityColleges, getTransferUniversities, searchTransferPathways } from '@/lib/supabase-client';

interface TransferPathway {
  id: string;
  source_institution_id: number;
  target_institution_id: number;
  agreement_type: string;
  requirements: string;
  program: string;
  source?: any;
  target?: any;
}

export default function TransferPathwaysPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);
  const [pathways, setPathways] = useState<TransferPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeType, setCollegeType] = useState<'cc' | 'university'>('cc');
  const [error, setError] = useState('');
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadColleges() {
      setLoading(true);
      
      try {
        let result;
        if (collegeType === 'cc') {
          result = await getCommunityColleges();
        } else {
          result = await getTransferUniversities();
        }
        
        if (result.error) {
          setError('Failed to load colleges');
        } else {
          setColleges(result.data || []);
        }
      } catch (err) {
        setError('Failed to load colleges');
      } finally {
        setLoading(false);
      }
    }
    
    loadColleges();
  }, [collegeType]);

  const handleCollegeSelect = async (college: any) => {
    setSelectedCollege(college);
    setPathwayLoading(true);
    
    try {
      const result = await searchTransferPathways(
        college.id, 
        collegeType === 'cc' ? 'source' : 'target'
      );
      
      if (result.error) {
        setError('Failed to load transfer pathways');
      } else {
        setPathways(result.data || []);
      }
    } catch (err) {
      setError('Failed to load transfer pathways');
    } finally {
      setPathwayLoading(false);
    }
  };

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="gradient-primary pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Transfer Pathway Explorer</h1>
          <p className="text-xl text-teal-50 max-w-2xl mx-auto">
            Find out where you can transfer after completing your degree at a community college
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg inline-flex">
            <button
              onClick={() => { setCollegeType('cc'); setSelectedCollege(null); setPathways([]); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                collegeType === 'cc' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔄 Starting at Community College
            </button>
            <button
              onClick={() => { setCollegeType('university'); setSelectedCollege(null); setPathways([]); }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                collegeType === 'university' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              🎓 Transferring to University
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* College Selection */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {collegeType === 'cc' ? 'Select Your Community College' : 'Select Your Target University'}
            </h2>
            
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredColleges.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No colleges found</p>
                ) : (
                  filteredColleges.slice(0, 50).map((college) => (
                    <button
                      key={college.id}
                      onClick={() => handleCollegeSelect(college)}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        selectedCollege?.id === college.id
                          ? 'bg-teal-50 border-2 border-teal-500'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">{college.name}</p>
                      <p className="text-sm text-slate-500">{college.city}, {college.state}</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Transfer Pathways Results */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {selectedCollege 
                ? `Transfer Options from ${selectedCollege.name}`
                : 'Select a college to see transfer options'}
            </h2>

            {!selectedCollege ? (
              <div className="text-center py-12 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p>Select a {collegeType === 'cc' ? 'community college' : 'university'} to see transfer pathways</p>
              </div>
            ) : pathwayLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : pathways.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">No transfer pathways found in our database</p>
                <p className="text-sm text-slate-400">
                  We&apos;re constantly adding new transfer agreements. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-500 mb-4">
                  {pathways.length} transfer {pathways.length === 1 ? 'pathway' : 'pathways'} available
                </p>
                
                {pathways.map((pathway) => (
                  <div 
                    key={pathway.id} 
                    className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {collegeType === 'cc' ? pathway.target?.name : pathway.source?.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {collegeType === 'cc' 
                            ? `${pathway.target?.city}, ${pathway.target?.state}`
                            : `${pathway.source?.city}, ${pathway.source?.state}`
                          }
                        </p>
                      </div>
                      <span className={`badge ${
                        pathway.agreement_type === 'automatic' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {pathway.agreement_type || 'Pathway'}
                      </span>
                    </div>
                    
                    {pathway.program && (
                      <p className="text-sm text-teal-600 mb-2">
                        📚 {pathway.program}
                      </p>
                    )}
                    
                    {pathway.requirements && (
                      <p className="text-sm text-slate-500">
                        Requirements: {pathway.requirements}
                      </p>
                    )}
                    
                    <div className="mt-3 flex gap-2">
                      {collegeType === 'cc' ? (
                        <Link 
                          href={`/college/${pathway.target_institution_id}`}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View Details →
                        </Link>
                      ) : (
                        <Link 
                          href={`/college/${pathway.source_institution_id}`}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 card p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">How Transfer Pathways Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Start at Community College</h3>
              <p className="text-slate-600 text-sm">
                Complete your associate degree or transfer credits at a community college. This is often more affordable and can help you adjust to college-level work.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Find Articulation Agreements</h3>
              <p className="text-slate-600 text-sm">
                Look for schools with formal articulation agreements that guarantee credit transfer. These agreements outline exactly which courses transfer.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Complete Your Bachelor&apos;s</h3>
              <p className="text-slate-600 text-sm">
                Transfer your credits and complete your bachelor&apos;s degree at a four-year university. Save money while earning your degree!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
