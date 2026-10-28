"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { AppShell, Badge, Burger, Button, Group, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSession } from "@/components/auth/useSession";
import { getDevRole } from "@/lib/role";
import { SidebarNav } from "./SidebarNav";
import { ThemeToggle } from "./ThemeToggle";

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const [signingOut, setSigningOut] = useState(false);
  const session = useSession();
  // A signed-in person's own role wins; otherwise the stand-in role from NEXT_PUBLIC_DEV_ROLE.
  const role = session?.role ?? getDevRole();

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Full page load on purpose: nothing from the signed-in session is left in the page.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    }
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Title order={4}>AI Hub (TCG)</Title>
            </Link>
          </Group>
          <Group>
            <Badge variant="light">{role}</Badge>
            {session && (
              <>
                <Text size="sm" visibleFrom="sm">
                  {session.name}
                </Text>
                <Button variant="default" size="xs" onClick={signOut} loading={signingOut}>
                  Sign out
                </Button>
              </>
            )}
            {session === null && (
              <Button component={Link} href="/login" variant="default" size="xs">
                Sign in
              </Button>
            )}
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Suspense>
          <SidebarNav role={role} />
        </Suspense>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
