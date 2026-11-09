import type { Metadata } from "next";
import { RunsScreen } from "@/features/runs/RunsScreen";

export const metadata: Metadata = { title: "TCG Runs" };

export default function Page() {
  return <RunsScreen />;
}
