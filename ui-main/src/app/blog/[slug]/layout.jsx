import { pageMeta, absUrl, INTERNAL_API_URL, JsonLd, articleLd, breadcrumbLd } from '../../../lib/seo';

async function getPost(slug) {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/public/blog/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.post || json?.post || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) {
    return pageMeta({ title: 'Article', description: 'Vedic astrology article on Jyotish Stack AI.', path: `/blog/${params.slug}` });
  }
  const description = post.excerpt || post.meta_description || `${post.title} — read this Vedic astrology article on Jyotish Stack AI.`;
  return pageMeta({
    title: post.title,
    description,
    path: `/blog/${post.slug}`,
    image: post.cover_image || undefined,
    type: 'article',
  });
}

export default async function BlogPostLayout({ children, params }) {
  const post = await getPost(params.slug);
  return (
    <>
      {post && (
        <>
          <JsonLd data={articleLd({
            title: post.title,
            description: post.excerpt || '',
            slug: post.slug,
            image: post.cover_image ? absUrl(post.cover_image) : undefined,
            publishedAt: post.published_at,
            updatedAt: post.updated_at,
            author: post.author,
          })} />
          <JsonLd data={breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ])} />
        </>
      )}
      {children}
    </>
  );
}
