import type { Metadata } from "next";
import { ProjectsScreen } from "@/features/projects/ProjectsScreen";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ProjectsScreen />;
}
