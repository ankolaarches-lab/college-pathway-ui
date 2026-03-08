import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/dashboard/', '/favorites/', '/search-history/'],
            },
        ],
        sitemap: 'https://college-pathway-explorer.vercel.app/sitemap.xml',
    };
}
