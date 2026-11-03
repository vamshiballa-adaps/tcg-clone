import type { Metadata } from "next";
import { HelpScreen } from "@/features/help/HelpScreen";

export const metadata: Metadata = { title: "Help & Feedback" };

export default function Page() {
  return <HelpScreen />;
}
