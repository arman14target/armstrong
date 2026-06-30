import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { markdownToHtml } from "@/lib/markdown";

const postsDirectory = path.join(process.cwd(), "posts");

export interface PostFrontMatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  keywords: string[];
  image?: string;
  related?: string[];
}

export interface PostListItem extends PostFrontMatter {
  id: string;
}

export interface PostData extends PostListItem {
  contentHtml: string;
}

function parseFrontMatter(
  id: string,
  data: Record<string, unknown>,
): PostFrontMatter {
  const title = typeof data.title === "string" ? data.title : id;
  const description =
    typeof data.description === "string" ? data.description : "";
  const date = typeof data.date === "string" ? data.date : "";
  const updated =
    typeof data.updated === "string" ? data.updated : undefined;
  const author =
    typeof data.author === "string" ? data.author : "Armstrong Team";
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.filter((item): item is string => typeof item === "string")
    : [];
  const image = typeof data.image === "string" ? data.image : undefined;
  const related = Array.isArray(data.related)
    ? data.related.filter((item): item is string => typeof item === "string")
    : undefined;

  return { title, description, date, updated, author, keywords, image, related };
}

function keywordOverlapScore(a: string[], b: string[]): number {
  const setA = new Set(a.map((k) => k.toLowerCase()));
  let score = 0;
  for (const keyword of b) {
    const lower = keyword.toLowerCase();
    for (const candidate of setA) {
      if (candidate.includes(lower) || lower.includes(candidate)) {
        score += 1;
      }
    }
  }
  return score;
}

export function getRelatedPosts(
  slug: string,
  limit = 3,
): PostListItem[] {
  const allPosts = getSortedPostsData();
  const current = allPosts.find((post) => post.id === slug);
  if (!current) {
    return [];
  }

  const manualSlugs = current.related ?? [];
  if (manualSlugs.length > 0) {
    const bySlug = new Map(allPosts.map((post) => [post.id, post]));
    return manualSlugs
      .map((id) => bySlug.get(id))
      .filter((post): post is PostListItem => post != null && post.id !== slug)
      .slice(0, limit);
  }

  return allPosts
    .filter((post) => post.id !== slug)
    .map((post) => ({
      post,
      score: keywordOverlapScore(current.keywords, post.keywords),
    }))
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map(({ post }) => post);
}

export function getSortedPostsData(): PostListItem[] {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);

      return {
        id,
        ...parseFrontMatter(id, matterResult.data),
      };
    });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) return 1;
    return -1;
  });
}

export function getAllPostIds(): string[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => fileName.replace(/\.md$/, ""));
}

export async function getPostData(id: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);
  const contentHtml = await markdownToHtml(matterResult.content);

  return {
    id,
    contentHtml,
    ...parseFrontMatter(id, matterResult.data),
  };
}
