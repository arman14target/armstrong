import type { Metadata } from "next";
import { BlogNav } from "@/components/blog/BlogNav";
import { blogSeo } from "@/lib/blogContent";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: blogSeo.title,
  description: blogSeo.description,
  keywords: [...blogSeo.keywords],
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  openGraph: {
    title: blogSeo.title,
    description: blogSeo.description,
    type: "website",
    url: absoluteUrl("/blog"),
    siteName: "Armstrong",
  },
  twitter: {
    card: "summary_large_image",
    title: blogSeo.title,
    description: blogSeo.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <BlogNav />
      {children}
    </>
  );
}
