"use client";

import { Suspense } from "react";
import Link from "next/link";
import { AppShell, Badge, Burger, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { getDevRole } from "@/lib/role";
import { SidebarNav } from "./SidebarNav";
import { ThemeToggle } from "./ThemeToggle";

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const role = getDevRole();

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
