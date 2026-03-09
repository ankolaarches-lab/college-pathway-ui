import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.gradetograd.com';

// All 50 US states as URL slugs
const STATE_SLUGS = [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new-hampshire', 'new-jersey', 'new-mexico', 'new-york',
    'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west-virginia', 'wisconsin', 'wyoming',
];

async function getAllCollegeIds(): Promise<number[]> {
    try {
        const apiBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        // Fetch all college IDs in batches
        const ids: number[] = [];
        let offset = 0;
        const limit = 500;

        while (true) {
            const res = await fetch(`${apiBase}/api/colleges?limit=${limit}&offset=${offset}`, {
                next: { revalidate: 86400 }, // Re-fetch once per day
            });
            if (!res.ok) break;
            const data = await res.json();
            const colleges = data.colleges || [];
            if (colleges.length === 0) break;
            ids.push(...colleges.map((c: { id: number }) => c.id));
            if (colleges.length < limit) break;
            offset += limit;
        }

        return ids;
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    // Core pages
    const corePages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
        { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/transfer-pathways`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ];

    // State landing pages
    const statePages: MetadataRoute.Sitemap = STATE_SLUGS.map((slug) => ({
        url: `${BASE_URL}/colleges/${slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Individual college pages (fetched dynamically)
    const collegeIds = await getAllCollegeIds();
    const collegePages: MetadataRoute.Sitemap = collegeIds.map((id) => ({
        url: `${BASE_URL}/college/${id}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }));

    return [...corePages, ...statePages, ...collegePages];
}
