import type { PostListItem } from "@/lib/posts";
import { BlogInfiniteList } from "@/components/blog/BlogInfiniteList";

interface BlogIndexProps {
  posts: PostListItem[];
}

export function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <div className="blog-shell">
      <section className="blog-hero" aria-labelledby="blog-heading">
        <p className="blog-kicker">Training guides</p>
        <h1
          id="blog-heading"
          className="blog-title font-display text-heading uppercase"
        >
          Blog
        </h1>
        <p className="blog-lead">
          Workout splits, macro guides, and strength training advice for lifters
          who track every set.
        </p>
      </section>

      <BlogInfiniteList posts={posts} />
    </div>
  );
}
