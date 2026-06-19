import { StaticPageRoot } from "@/components/landing/StaticPageRoot";

export default function PlannerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StaticPageRoot>{children}</StaticPageRoot>;
}
