import Link from "next/link";

export function BlogNav() {
  return (
    <header className="blog-nav">
      <Link
        href="/"
        className="font-display text-sm tracking-[3px] text-heading uppercase transition-colors hover:text-cyan"
      >
        Armstrong
      </Link>
      <nav aria-label="Blog navigation" className="blog-nav__links">
        <Link href="/blog/" className="blog-nav__link">
          All posts
        </Link>
        <Link href="/landing/" className="blog-nav__link">
          App
        </Link>
      </nav>
    </header>
  );
}
