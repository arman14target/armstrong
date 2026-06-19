import Script from "next/script";
import { LandingPageRoot } from "@/components/landing/LandingPageRoot";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Script id="reveal-js" strategy="beforeInteractive">
        {`document.documentElement.classList.add("reveal-js");`}
      </Script>
      <noscript>
        <style>{`.reveal-hidden{opacity:1!important;transform:none!important;}`}</style>
      </noscript>
      <LandingPageRoot>{children}</LandingPageRoot>
    </>
  );
}
