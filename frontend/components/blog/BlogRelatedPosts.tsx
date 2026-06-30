import Link from "next/link";
import Image from "next/image";
import type { PostListItem } from "@/lib/posts";
import { withBasePath } from "@/lib/basePath";

interface BlogRelatedPostsProps {
  posts: PostListItem[];
}

export function BlogRelatedPosts({ posts }: BlogRelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="blog-related" aria-labelledby="blog-related-heading">
      <h2 id="blog-related-heading" className="blog-related__title">
        Related guides
      </h2>
      <ol className="blog-list">
        {posts.map((post) => (
          <li key={post.id} className="blog-card">
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
              <h3 className="blog-card__title">
                <Link href={`/blog/${post.id}/`}>{post.title}</Link>
              </h3>
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
  );
}
