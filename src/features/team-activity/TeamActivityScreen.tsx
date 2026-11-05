"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Group, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import { getDevRole } from "@/lib/role";
import { TEAM } from "./data";

// Team Activity (A-09): who is on the team and what they did lately. Everyone sees the same people; only an admin gets a
// control on each name that opens that person's activity, so the page's controls (not just its data) depend on the role.
// The activity is seeded and nothing is saved. The open person lives in this component only.
export function TeamActivityScreen() {
  const session = useSession();
  const [openName, setOpenName] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so close the open person then: every visit starts with none open.
  useEffect(() => () => setOpenName(null), []);

  // Opening a person moves focus to their heading, so a keyboard or screen-reader user lands on what just appeared.
  useEffect(() => {
    if (openName) headingRef.current?.focus();
  }, [openName]);

  // Wait for the session: the stand-in role is admin, so a user would otherwise see the admins' buttons for a moment.
  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
  const isAdmin = role === "admin";
  const open = TEAM.find((m) => m.name === openName) ?? null;

  function toggle(name: string) {
    setOpenName(openName === name ? null : name);
  }

  function closeDetails() {
    const name = openName;
    setOpenName(null);
    if (name) buttonRefs.current[name]?.focus();
  }

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>Team Activity</Title>
      <Text c="dimmed">Who is on the team and what they have been doing.</Text>

      {role !== undefined && (
        <>
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>People</Title>
              <Text size="sm" c="dimmed">
                {isAdmin
                  ? "Select a person to open their activity."
                  : "Only a workspace admin can open a person's activity."}
              </Text>
              <Text size="sm" c="dimmed" aria-live="polite">
                Showing {TEAM.length} people
              </Text>
              <Table.ScrollContainer minWidth={480}>
                <Table withTableBorder striped aria-label="Team members">
                  <Table.Thead>
                    <Table.Tr>
                      {["Person", "Role", "Runs this month", "Last active"].map((column) => (
                        // scope="col" is what makes the browser expose these as column headers (see the Projects table).
                        <Table.Th key={column} scope="col" ta={column === "Runs this month" ? "right" : undefined}>
                          {column}
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {TEAM.map((m) => (
                      <Table.Tr key={m.name}>
                        <Table.Td>
                          {isAdmin ? (
                            <Button
                              ref={(el) => {
                                buttonRefs.current[m.name] = el;
                              }}
                              variant="subtle"
                              size="compact-sm"
                              aria-expanded={openName === m.name}
                              onClick={() => toggle(m.name)}
                            >
                              {m.name}
                            </Button>
                          ) : (
                            m.name
                          )}
                        </Table.Td>
                        <Table.Td>{m.role}</Table.Td>
                        <Table.Td ta="right">{m.runsThisMonth}</Table.Td>
                        <Table.Td>{m.lastActive}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>

          {isAdmin && open && (
            <Paper withBorder p="md">
              <Stack gap="sm">
                <Title order={3} ref={headingRef} tabIndex={-1}>
                  Activity for {open.name}
                </Title>
                <Table.ScrollContainer minWidth={420}>
                  <Table withTableBorder striped aria-label="Recent activity">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th scope="col">Date</Table.Th>
                        <Table.Th scope="col">Activity</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {open.events.map((e) => (
                        <Table.Tr key={`${e.date}-${e.what}`}>
                          <Table.Td>{e.date}</Table.Td>
                          <Table.Td>{e.what}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                <Group>
                  <Button variant="default" onClick={closeDetails}>
                    Close details
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}
