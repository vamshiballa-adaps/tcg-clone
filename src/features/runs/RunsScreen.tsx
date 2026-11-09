"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anchor, Badge, Button, Group, NativeSelect, Stack, Table, Tabs, Text, TextInput, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import {
  emptyMessage,
  matchesRun,
  RUN_STATUSES,
  runsInScope,
  SEED_RUNS,
  type RunScope,
  type RunStatus,
} from "./data";

const STATUS_COLOR: Record<RunStatus, string> = { Draft: "gray", Running: "blue", Completed: "green", Failed: "red" };
const STATUS_OPTIONS = [{ value: "", label: "All statuses" }, ...RUN_STATUSES.map((s) => ({ value: s, label: s }))];
const COLUMNS = ["Run", "Project", "Created by", "Stage", "Status", "Started", "Test cases"];
const FIRST_TAB: RunScope = "mine";

// TCG Runs (U-01): every run in one table, with Mine and Everyone tabs, a search and a status filter. "Mine" is the
// runs the signed-in person created, so it differs per account. The list is seeded and nothing is saved. Each run name
// links to its report page, which is still a placeholder. State lives in this component only.
export function RunsScreen() {
  const session = useSession();
  const [scope, setScope] = useState<RunScope>(FIRST_TAB);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RunStatus | "">("");

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the Mine tab, an empty search and every status then.
  useEffect(
    () => () => {
      setScope(FIRST_TAB);
      setQuery("");
      setStatus("");
    },
    [],
  );

  const known = session !== undefined;
  const tabRuns = runsInScope(SEED_RUNS, scope, session?.name ?? "");
  const shown = tabRuns.filter((r) => matchesRun(r, query) && (!status || r.status === status));

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>TCG Runs</Title>
        <Button component={Link} href="/tcg/runs/start">
          Start a run
        </Button>
      </Group>
      <Text c="dimmed">Every run, from requirements to results.</Text>

      {/* Waits for the session: "Mine" depends on who is signed in, so nothing is drawn from the wrong person's list. */}
      {known && (
        <Tabs value={scope} onChange={(value) => setScope((value as RunScope | null) ?? FIRST_TAB)} keepMounted={false}>
          <Tabs.List aria-label="Run scope">
            <Tabs.Tab value="mine">Mine</Tabs.Tab>
            <Tabs.Tab value="everyone">Everyone</Tabs.Tab>
          </Tabs.List>

          {(["mine", "everyone"] as const).map((value) => (
            <Tabs.Panel key={value} value={value} pt="md">
              <Stack gap="md">
                <Group align="flex-end">
                  <TextInput
                    label="Search runs"
                    placeholder="Run, project or creator"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                  />
                  <NativeSelect
                    label="Filter by status"
                    data={STATUS_OPTIONS}
                    value={status}
                    onChange={(e) => setStatus(e.currentTarget.value as RunStatus | "")}
                  />
                </Group>
                <Text size="sm" c="dimmed">
                  Showing {shown.length} of {tabRuns.length} runs
                </Text>

                {shown.length === 0 ? (
                  <Text>{emptyMessage(query, status, scope, tabRuns.length)}</Text>
                ) : (
                  <Table.ScrollContainer minWidth={820}>
                    <Table withTableBorder striped aria-label="Runs">
                      <Table.Thead>
                        <Table.Tr>
                          {COLUMNS.map((column) => (
                            <Table.Th key={column} scope="col">
                              {column}
                            </Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {shown.map((r) => (
                          <Table.Tr key={r.id}>
                            <Table.Td>
                              <Anchor component={Link} href={`/tcg/runs/${r.id}`}>
                                {r.name}
                              </Anchor>
                            </Table.Td>
                            <Table.Td>{r.project}</Table.Td>
                            <Table.Td>{r.creator}</Table.Td>
                            <Table.Td>{r.stage}</Table.Td>
                            <Table.Td>
                              {/* tt="none": Badge capitalises by default, so the screen would say "RUNNING" while the DOM says "Running". */}
                              <Badge color={STATUS_COLOR[r.status]} variant="light" tt="none">
                                {r.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{r.started}</Table.Td>
                            <Table.Td>{r.testCases}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>
          ))}
        </Tabs>
      )}
    </Stack>
  );
}
