import { AppShellLayout } from "@/components/shell/AppShellLayout";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
