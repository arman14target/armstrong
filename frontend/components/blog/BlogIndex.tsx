import type { PostListItem } from "@/lib/posts";
import { BlogInfiniteList } from "@/components/blog/BlogInfiniteList";

interface BlogIndexProps {
  posts: PostListItem[];
}

export function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <div className="blog-shell">
      <section className="blog-hero" aria-labelledby="blog-heading">
        <p className="blog-kicker">Gym guides & training</p>
        <h1
          id="blog-heading"
          className="blog-title font-display text-heading uppercase"
        >
          Blog
        </h1>
        <p className="blog-lead">
          UK and Ireland gym membership guides — prices, locations, and chain
          comparisons for Dublin, London, and beyond. Plus workout splits and
          strength training advice for lifters who track every set.
        </p>
      </section>

      <BlogInfiniteList posts={posts} />
    </div>
  );
}
