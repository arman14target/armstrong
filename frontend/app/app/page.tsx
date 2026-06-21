import type { Metadata } from "next";
import { AppGate } from "@/components/welcome/AppGate";

export const metadata: Metadata = {
  title: "Armstrong App",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppPage() {
  return <AppGate />;
}
