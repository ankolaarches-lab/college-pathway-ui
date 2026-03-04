"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Mock data
const mockColleges: Record<number, any> = {
  1: { id: 1, name: "Stanford University", city: "Stanford", state: "CA", type: "Private 4-Year", tuition: 56169, inStateTuition: 56169, admissionRate: 3.7, graduationRate: 96, medianEarnings: 93600, costAfterAid: 22000, enrollment: 17000, studentFacultyRatio: "3:1", satRange: "1450-1570" },
  2: { id: 2, name: "University of Michigan", city: "Ann Arbor", state: "MI", type: "Public 4-Year", tuition: 16736, inStateTuition: 16736, admissionRate: 17.7, graduationRate: 93, medianEarnings: 72400, costAfterAid: 14000, enrollment: 46000, studentFacultyRatio: "15:1", satRange: "1340-1530" },
  3: { id: 3, name: "UCLA", city: "Los Angeles", state: "CA", type: "Public 4-Year", tuition: 14178, inStateTuition: 14178, admissionRate: 8.8, graduationRate: 91, medianEarnings: 68400, costAfterAid: 8500, enrollment: 44000, studentFacultyRatio: "18:1", satRange: "1290-1520" },
  4: { id: 4, name: "MIT", city: "Cambridge", state: "MA", type: "Private 4-Year", tuition: 57590, inStateTuition: 57590, admissionRate: 3.9, graduationRate: 96, medianEarnings: 113100, costAfterAid: 20000, enrollment: 11000, studentFacultyRatio: "3:1", satRange: "1510-1570" },
  5: { id: 5, name: "UC Berkeley", city: "Berkeley", state: "CA", type: "Public 4-Year", tuition: 14312, inStateTuition: 14312, admissionRate: 11.6, graduationRate: 90, medianEarnings: 76200, costAfterAid: 9000, enrollment: 43000, studentFacultyRatio: "20:1", satRange: "1300-1530" },
  6: { id: 6, name: "Duke University", city: "Durham", state: "NC", type: "Private 4-Year", tuition: 60435, inStateTuition: 60435, admissionRate: 5.1, graduationRate: 96, medianEarnings: 83700, costAfterAid: 24000, enrollment: 16000, studentFacultyRatio: "6:1", satRange: "1450-1570" },
};

function CompareContent() {
  const searchParams = useSearchParams();
  const [colleges, setColleges] = useState<any[]>([]);

  useEffect(() => {
    const ids = searchParams.get("colleges");
    if (ids) {
      const collegeIds = ids.split(",").map(Number).filter(id => mockColleges[id]);
      setColleges(collegeIds.map(id => mockColleges[id]));
    }
  }, [searchParams]);

  const clearAll = () => {
    setColleges([]);
  };

  // Find best values for highlighting
  const getBestValue = (values: number[], type: "high" | "low") => {
    if (type === "high") return Math.max(...values);
    return Math.min(...values);
  };

  if (colleges.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Colleges to Compare</h2>
          <p className="text-slate-500 mb-6">Add colleges from the search page to compare them side by side.</p>
          <Link href="/search" className="btn-primary inline-block">
            Search Colleges
          </Link>
        </div>
      </div>
    );
  }

  const tuitionValues = colleges.map(c => c.tuition);
  const graduationValues = colleges.map(c => c.graduationRate);
  const earningsValues = colleges.map(c => c.medianEarnings);
  const admissionValues = colleges.map(c => c.admissionRate);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Compare Colleges</h1>
            <p className="text-slate-500">{colleges.length} colleges selected</p>
          </div>
          <button onClick={clearAll} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 bg-slate-100 rounded-tl-lg min-w-48">
                  <span className="text-slate-500 font-medium">Attribute</span>
                </th>
                {colleges.map((college) => (
                  <th key={college.id} className="p-4 bg-white min-w-56">
                    <div className="text-center">
                      <Link href={`/college/${college.id}`} className="text-lg font-semibold text-slate-800 hover:text-teal-600 transition-colors">
                        {college.name}
                      </Link>
                      <p className="text-sm text-slate-500">{college.city}, {college.state}</p>
                      <span className="badge badge-secondary mt-2">{college.type}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Tuition */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Tuition (per year)</td>
                {colleges.map((college, idx) => (
                  <td key={college.id} className={`p-4 text-center ${college.tuition === getBestValue(tuitionValues, "low") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.tuition === getBestValue(tuitionValues, "low") ? "text-teal-600" : "text-slate-800"}`}>
                      ${college.tuition.toLocaleString()}
                    </span>
                    {college.tuition === getBestValue(tuitionValues, "low") && <span className="block text-xs text-teal-500">Best value</span>}
                  </td>
                ))}
              </tr>

              {/* Cost After Aid */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Cost After Aid</td>
                {colleges.map((college) => (
                  <td key={college.id} className="p-4 text-center bg-white">
                    <span className="text-lg font-semibold text-teal-600">${college.costAfterAid.toLocaleString()}</span>
                  </td>
                ))}
              </tr>

              {/* Admission Rate */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Admission Rate</td>
                {colleges.map((college, idx) => (
                  <td key={college.id} className={`p-4 text-center ${college.admissionRate === getBestValue(admissionValues, "high") ? "bg-cyan-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.admissionRate === getBestValue(admissionValues, "high") ? "text-cyan-600" : "text-slate-800"}`}>
                      {college.admissionRate}%
                    </span>
                  </td>
                ))}
              </tr>

              {/* Graduation Rate */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Graduation Rate</td>
                {colleges.map((college, idx) => (
                  <td key={college.id} className={`p-4 text-center ${college.graduationRate === getBestValue(graduationValues, "high") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.graduationRate === getBestValue(graduationValues, "high") ? "text-teal-600" : "text-slate-800"}`}>
                      {college.graduationRate}%
                    </span>
                    {college.graduationRate === getBestValue(graduationValues, "high") && <span className="block text-xs text-teal-500">Highest</span>}
                  </td>
                ))}
              </tr>

              {/* Median Earnings */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Median Earnings</td>
                {colleges.map((college, idx) => (
                  <td key={college.id} className={`p-4 text-center ${college.medianEarnings === getBestValue(earningsValues, "high") ? "bg-teal-50" : "bg-white"}`}>
                    <span className={`text-lg font-semibold ${college.medianEarnings === getBestValue(earningsValues, "high") ? "text-teal-600" : "text-slate-800"}`}>
                      ${college.medianEarnings.toLocaleString()}
                    </span>
                    {college.medianEarnings === getBestValue(earningsValues, "high") && <span className="block text-xs text-teal-500">Highest</span>}
                  </td>
                ))}
              </tr>

              {/* Enrollment */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Enrollment</td>
                {colleges.map((college) => (
                  <td key={college.id} className="p-4 text-center bg-white">
                    <span className="text-lg font-semibold text-slate-800">{college.enrollment.toLocaleString()}</span>
                  </td>
                ))}
              </tr>

              {/* Student-Faculty Ratio */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700">Student-Faculty Ratio</td>
                {colleges.map((college) => (
                  <td key={college.id} className="p-4 text-center bg-white">
                    <span className="text-lg font-semibold text-slate-800">{college.studentFacultyRatio}</span>
                  </td>
                ))}
              </tr>

              {/* SAT Range */}
              <tr>
                <td className="p-4 bg-slate-50 font-medium text-slate-700 rounded-bl-lg">SAT Range</td>
                {colleges.map((college) => (
                  <td key={college.id} className="p-4 text-center bg-white rounded-br-lg">
                    <span className="text-lg font-semibold text-slate-800">{college.satRange}</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link href="/search" className="btn-secondary flex-1 text-center">
            ← Back to Search
          </Link>
        </div>
      </div>
    </div>
  );
}

function CompareLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareLoading />}>
      <CompareContent />
    </Suspense>
  );
}
