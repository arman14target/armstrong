import { LandingPageRoot } from "@/components/landing/LandingPageRoot";

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LandingPageRoot>{children}</LandingPageRoot>;
}
