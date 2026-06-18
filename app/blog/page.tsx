import { BlogIndex } from "@/components/blog/BlogIndex";
import { BlogIndexSchema } from "@/components/blog/BlogIndexSchema";
import { getSortedPostsData } from "@/lib/posts";

export default function BlogPage() {
  const posts = getSortedPostsData();

  return (
    <>
      <BlogIndexSchema />
      <BlogIndex posts={posts} />
    </>
  );
}
