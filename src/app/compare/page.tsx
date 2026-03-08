import { constructMetadata } from "@/lib/seo";
import CompareClient from "./CompareClient";
import { Suspense } from "react";

export const metadata = constructMetadata({
  title: "Compare Colleges",
  description: "Compare tuition, graduation rates, and median earnings side-by-side. Make informed decisions about your future with our college comparison tool."
});

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading comparison tool...</p>
        </div>
      </div>
    }>
      <CompareClient />
    </Suspense>
  );
}
