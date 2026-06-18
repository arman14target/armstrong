import Link from "next/link";
import type { PostData } from "@/lib/posts";
import { withBasePath } from "@/lib/basePath";

interface BlogPostProps {
  post: PostData;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function BlogPost({ post }: BlogPostProps) {
  const published = formatDate(post.date);
  const updated = post.updated ? formatDate(post.updated) : null;

  return (
    <article className="blog-shell blog-article">
      <nav aria-label="Breadcrumb" className="blog-breadcrumb">
        <ol>
          <li>
            <Link href="/blog/">Blog</Link>
          </li>
          <li aria-current="page">{post.title}</li>
        </ol>
      </nav>

      <header className="blog-article__header">
        <p className="blog-kicker">{post.author}</p>
        {post.image ? (
          <div className="blog-article__image-wrap">
            <img
              src={withBasePath(post.image)}
              alt=""
              className="blog-article__image"
              width={1280}
              height={720}
              loading="eager"
              decoding="async"
            />
          </div>
        ) : null}
        <h1 className="blog-title font-display text-heading uppercase">
          {post.title}
        </h1>
        <p className="blog-lead">{post.description}</p>
        <div className="blog-article__meta">
          <time dateTime={post.date}>Published {published}</time>
          {updated && post.updated !== post.date ? (
            <time dateTime={post.updated}>Updated {updated}</time>
          ) : null}
        </div>
      </header>

      <div
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  );
}
