"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PostListItem } from "@/lib/posts";
import { withBasePath } from "@/lib/basePath";

const PAGE_SIZE = 6;

interface BlogInfiniteListProps {
  posts: PostListItem[];
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function BlogPostCard({ post }: { post: PostListItem }) {
  return (
    <li className="blog-card">
      <article>
        {post.image ? (
          <Link
            href={`/blog/${post.id}/`}
            className="blog-card__image-link"
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={withBasePath(post.image)}
              alt=""
              className="blog-card__image"
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </Link>
        ) : null}
        <time className="blog-card__date" dateTime={post.date}>
          {formatDate(post.date)}
        </time>
        <h2 className="blog-card__title">
          <Link href={`/blog/${post.id}/`}>{post.title}</Link>
        </h2>
        <p className="blog-card__description">{post.description}</p>
        <Link
          href={`/blog/${post.id}/`}
          className="blog-card__read-more"
          aria-label={`Read ${post.title}`}
        >
          Read article →
        </Link>
      </article>
    </li>
  );
}

export function BlogInfiniteList({ posts }: BlogInfiniteListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < posts.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, posts.length));
        }
      },
      { rootMargin: "320px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, posts.length, visibleCount]);

  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <section aria-label="Blog posts">
      <ol className="blog-list">
        {visiblePosts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </ol>
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="blog-list__loader"
          role="status"
          aria-live="polite"
        >
          <span className="blog-list__loader-text">Loading more articles…</span>
        </div>
      ) : null}
    </section>
  );
}
