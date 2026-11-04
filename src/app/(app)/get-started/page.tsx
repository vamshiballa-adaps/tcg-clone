import type { Metadata } from "next";
import { GetStartedScreen } from "@/features/get-started/GetStartedScreen";

export const metadata: Metadata = { title: "Get Started" };

export default function Page() {
  return <GetStartedScreen />;
}
