import type { Metadata } from "next";
import { MyTimeScreen } from "@/features/my-time/MyTimeScreen";

export const metadata: Metadata = { title: "My TCG Time" };

export default function Page() {
  return <MyTimeScreen />;
}
