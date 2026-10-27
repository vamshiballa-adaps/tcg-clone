"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink, Text } from "@mantine/core";
import { ROUTES, type NavGroup } from "@/config/routes";
import { canAccess, type Role } from "@/lib/role";

const GROUPS: NavGroup[] = ["My Work", "My Insights", "My Organization"];

// Reads the pathname (runtime data), so callers must wrap it in <Suspense>.
export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <>
      {GROUPS.map((group) => {
        const items = ROUTES.filter((r) => r.nav?.group === group && canAccess(role, r.roles));
        if (!items.length) return null;
        return (
          <div key={group}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="md" mb={4}>
              {group}
            </Text>
            {items.map((r) => (
              <NavLink
                key={r.path}
                component={Link}
                href={r.path}
                label={r.nav!.label}
                active={r.path === "/" ? pathname === "/" : pathname.startsWith(r.path)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
