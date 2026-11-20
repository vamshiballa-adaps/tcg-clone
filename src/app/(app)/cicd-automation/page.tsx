import type { Metadata } from "next";
import { CicdScreen } from "@/features/cicd/CicdScreen";

export const metadata: Metadata = { title: "CI/CD Automation" };

export default function Page() {
  return <CicdScreen />;
}
