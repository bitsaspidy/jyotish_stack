import { INTERNAL_API_URL } from '../../../lib/seo';
import BlogPostView from './BlogPostView';

// Fetched on the server so the article body ships in the initial HTML (crawlers
// used to get only the client-side loading spinner). Identical options to the
// layout's fetch, so Next dedupes them into one upstream call per render; the
// 5-min revalidate keeps API load flat while BlogPostView's mount-time refetch
// handles per-visit view_count and any fresher edits.
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

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  return <BlogPostView initialPost={post} slug={params.slug} />;
}
