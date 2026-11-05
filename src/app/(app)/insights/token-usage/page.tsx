import type { Metadata } from "next";
import { TokenUsageScreen } from "@/features/token-usage/TokenUsageScreen";

export const metadata: Metadata = { title: "Token Usage" };

export default function Page() {
  return <TokenUsageScreen />;
}
