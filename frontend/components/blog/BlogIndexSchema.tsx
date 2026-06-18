import { absoluteUrl } from "@/lib/siteUrl";

export function BlogIndexSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog",
    description:
      "Workout plans, macro guides, and strength training advice from Armstrong.",
    url: absoluteUrl("/blog"),
    publisher: {
      "@type": "Organization",
      name: "Armstrong",
    },
    inLanguage: "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
