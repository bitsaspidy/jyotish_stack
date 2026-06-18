// Centralised SEO helpers — canonical URLs, Open Graph, Twitter cards, JSON-LD.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jyotishstack.com').replace(/\/$/, '');
export const SITE_NAME = 'Jyotish Stack AI';
export const DEFAULT_OG_IMAGE = '/logo.svg';

// Server-side base for fetching during metadata/sitemap generation
export const INTERNAL_API_URL = (process.env.INTERNAL_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export function absUrl(path = '/') {
  if (!path || path === '/') return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  return SITE_URL + (path.startsWith('/') ? path : `/${path}`);
}

/**
 * Build a complete Next.js metadata object for a public page.
 * Title is left plain so the root layout's title template ("%s | Jyotish Stack AI") applies.
 */
export function pageMeta({ title, description, path = '/', keywords, image = DEFAULT_OG_IMAGE, type = 'website', noindex = false }) {
  const url = absUrl(path);
  const ogTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_IN',
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image],
    },
  };
}

// ─── JSON-LD structured data builders ──────────────────────────────────────────
export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absUrl('/logo-icon.svg'),
    description: 'Vedic astrology platform offering Kundli, matchmaking, horoscope and AI-powered predictions.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@jyotishstack.com',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: ['en', 'hi'],
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/blog?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}

export function articleLd({ title, description, slug, image, publishedAt, updatedAt, author }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : [absUrl(DEFAULT_OG_IMAGE)],
    datePublished: publishedAt || undefined,
    dateModified: updatedAt || publishedAt || undefined,
    author: { '@type': author ? 'Person' : 'Organization', name: author || SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absUrl('/logo-icon.svg') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(`/blog/${slug}`) },
  };
}

// Renders a JSON-LD <script>. Use inside a server component.
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
