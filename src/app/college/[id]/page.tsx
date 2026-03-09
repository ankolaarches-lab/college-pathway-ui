import { constructMetadata } from "@/lib/seo";
import CollegeClient from "./CollegeClient";
import Script from "next/script";

const SITE_URL = 'https://www.gradetograd.com';

interface College {
  name: string;
  city: string;
  state: string;
  type: string;
  tuition: number | null;
  admission_rate: number | null;
  graduation_rate: number | null;
  median_earnings: number | null;
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

  const parts: string[] = [`${college.name} is a ${college.type} institution in ${college.city}, ${college.state}.`];
  if (college.tuition) parts.push(`Tuition: $${college.tuition.toLocaleString()}/yr.`);
  if (college.admission_rate) parts.push(`Acceptance rate: ${college.admission_rate.toFixed(1)}%.`);
  if (college.graduation_rate) parts.push(`Graduation rate: ${college.graduation_rate.toFixed(1)}%.`);
  if (college.median_earnings) parts.push(`Median earnings: $${college.median_earnings.toLocaleString()}.`);
  parts.push('Compare tuition, outcomes, and transfer pathways on GradeToGrad.');

  return constructMetadata({
    title: `${college.name} — Tuition, Acceptance Rate & Outcomes ${new Date().getFullYear()}`,
    description: parts.join(' '),
  });
}

export default async function CollegeDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const college = await getCollege(params.id);

  const jsonLd = college ? {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: college.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: college.city,
      addressRegion: college.state,
      addressCountry: 'US',
    },
    url: `${SITE_URL}/college/${params.id}`,
    description: college.description || `${college.name} is a ${college.type} institution located in ${college.city}, ${college.state}.`,
    ...(college.tuition && {
      offers: {
        '@type': 'Offer',
        name: 'Annual Tuition',
        price: college.tuition,
        priceCurrency: 'USD',
      },
    }),
    ...(college.admission_rate && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Acceptance Rate',
        value: `${college.admission_rate.toFixed(1)}%`,
      },
    }),
  } : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="college-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CollegeClient collegeId={params.id} />
    </>
  );
}
