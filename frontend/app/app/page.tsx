import type { Metadata } from "next";
import { HomeScreen } from "@/components/HomeScreen";

export const metadata: Metadata = {
  title: "Armstrong App",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppPage() {
  return <HomeScreen />;
}
