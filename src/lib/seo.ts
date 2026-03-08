import { Metadata } from 'next';

const siteConfig = {
    name: 'CollegePath',
    title: 'College Pathway Explorer',
    description: 'Empowering students and parents with data-driven insights to find the perfect college path. Compare tuition, careers, and graduation outcomes.',
    url: 'https://college-pathway-explorer.vercel.app',
    ogImage: 'https://college-pathway-explorer.vercel.app/og-image.png', // We should generate this or have a placeholder
    twitterHandle: '@collegepath',
};

export function constructMetadata({
    title = siteConfig.title,
    description = siteConfig.description,
    image = siteConfig.ogImage,
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string;
    noIndex?: boolean;
} = {}): Metadata {
    return {
        title: {
            default: title,
            template: `%s | ${siteConfig.name}`,
        },
        description,
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: siteConfig.url,
            siteName: siteConfig.name,
            title,
            description,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: siteConfig.twitterHandle,
        },
        icons: {
            icon: '/favicon.ico',
            shortcut: '/favicon.ico',
            apple: '/apple-touch-icon.png',
        },
        metadataBase: new URL(siteConfig.url),
        ...(noIndex && {
            robots: {
                index: false,
                follow: false,
            },
        }),
    };
}
