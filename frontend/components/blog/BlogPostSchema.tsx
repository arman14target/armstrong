import type { PostData } from "@/lib/posts";
import { absoluteAssetUrl, absoluteUrl } from "@/lib/siteUrl";

interface BlogPostSchemaProps {
  post: PostData;
}

export function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const url = absoluteUrl(`/blog/${post.id}`);
  const published = new Date(post.date).toISOString();
  const modified = new Date(post.updated ?? post.date).toISOString();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: published,
    dateModified: modified,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Armstrong",
      url: absoluteUrl("/"),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    keywords: post.keywords.join(", "),
    articleSection: "Fitness",
    inLanguage: "en-US",
    ...(post.image
      ? {
          image: {
            "@type": "ImageObject",
            url: absoluteAssetUrl(post.image),
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
