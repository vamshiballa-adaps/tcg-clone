import type { Metadata } from "next";
import { PlanScreen } from "@/features/plan/PlanScreen";

export const metadata: Metadata = { title: "My Plan" };

export default function Page() {
  return <PlanScreen />;
}
