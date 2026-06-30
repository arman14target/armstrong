import Link from "next/link";

export function BlogAppCta() {
  return (
    <aside className="blog-app-cta" aria-label="Armstrong app">
      <p className="blog-app-cta__text">
        Picked a gym? Track every set free in Armstrong.
      </p>
      <Link href="/app/" className="blog-app-cta__link">
        Open Armstrong →
      </Link>
    </aside>
  );
}
