import type { Metadata } from "next";
import { InputsScreen } from "@/features/inputs/InputsScreen";

export const metadata: Metadata = { title: "Inputs Registry" };

export default function Page() {
  return <InputsScreen />;
}
