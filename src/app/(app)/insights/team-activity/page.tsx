import type { Metadata } from "next";
import { TeamActivityScreen } from "@/features/team-activity/TeamActivityScreen";

export const metadata: Metadata = { title: "Team Activity" };

export default function Page() {
  return <TeamActivityScreen />;
}
