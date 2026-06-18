import Link from "next/link";
import type { PostListItem } from "@/lib/posts";

interface BlogIndexProps {
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

export function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <div className="blog-shell">
      <section className="blog-hero" aria-labelledby="blog-heading">
        <p className="blog-kicker">Training guides</p>
        <h1
          id="blog-heading"
          className="blog-title font-display text-heading uppercase"
        >
          Armstrong Blog
        </h1>
        <p className="blog-lead">
          Workout splits, macro guides, and strength training advice for lifters
          who track every set.
        </p>
      </section>

      <section aria-label="Blog posts">
        <ol className="blog-list">
          {posts.map((post) => (
            <li key={post.id} className="blog-card">
              <article>
                <time
                  className="blog-card__date"
                  dateTime={post.date}
                >
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
          ))}
        </ol>
      </section>
    </div>
  );
}
