import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost } from "@/components/blog/BlogPost";
import { BlogPostSchema } from "@/components/blog/BlogPostSchema";
import { getAllPostIds, getPostData } from "@/lib/posts";
import { absoluteUrl } from "@/lib/siteUrl";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPostIds().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getPostData(slug);
    const url = absoluteUrl(`/blog/${post.id}`);

    return {
      title: `${post.title} | Armstrong Blog`,
      description: post.description,
      keywords: post.keywords,
      authors: [{ name: post.author }],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: post.title,
        description: post.description,
        type: "article",
        url,
        siteName: "Armstrong",
        publishedTime: new Date(post.date).toISOString(),
        modifiedTime: new Date(post.updated ?? post.date).toISOString(),
        authors: [post.author],
        tags: post.keywords,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostData(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <BlogPostSchema post={post} />
      <BlogPost post={post} />
    </>
  );
}
