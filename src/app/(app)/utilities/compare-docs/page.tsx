import type { Metadata } from "next";
import { CompareDocsScreen } from "@/features/compare-docs/CompareDocsScreen";

export const metadata: Metadata = { title: "Compare Docs" };

export default function Page() {
  return <CompareDocsScreen />;
}
