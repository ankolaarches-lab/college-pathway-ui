import { constructMetadata } from "@/lib/seo";
import CollegeClient from "./CollegeClient";
import { use } from "react";

interface College {
  name: string;
  city: string;
  state: string;
  type: string;
  description?: string;
}

async function getCollege(id: string): Promise<College | null> {
  try {
    // We fetch from the same API used in the client, but server-side
    // Note: In production, you might want to call your DB directly here
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/colleges?id=${id}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data.colleges)) {
      return data.colleges.find((c: any) => c.id === parseInt(id)) || null;
    }
    return data.id === parseInt(id) ? data : null;
  } catch (error) {
    console.error("Error fetching college for metadata:", error);
    return null;
  }
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const college = await getCollege(params.id);

  if (!college) {
    return constructMetadata({
      title: "College Not Found",
      noIndex: true
    });
  }

  return constructMetadata({
    title: `${college.name} - ${college.city}, ${college.state}`,
    description: college.description || `Learn about ${college.name} in ${college.city}, ${college.state}. View tuition, graduation rates, earnings, and transfer pathways.`,
    // In a real app, you might have specific OG images for each college
  });
}

export default function CollegeDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  return <CollegeClient collegeId={params.id} />;
}
