import { AppShellLayout } from "@/components/shell/AppShellLayout";

export default function AppLayout({ children, startup }: LayoutProps<"/">) {
  return (
    <>
      {startup}
      <AppShellLayout>{children}</AppShellLayout>
    </>
  );
}
