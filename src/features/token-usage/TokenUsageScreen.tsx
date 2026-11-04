"use client";

import { useEffect, useState } from "react";
import { Box, Button, Group, NativeSelect, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import { formatTokens, SEED_ALLOWANCE } from "@/features/plan/data";
import { getDevRole } from "@/lib/role";
import {
  filterUsage,
  hasFilters,
  NO_FILTERS,
  OPERATIONS,
  PEOPLE,
  PERIODS,
  SEED_USAGE,
  sumTokens,
  type Filters,
} from "./data";

const PERIOD_OPTIONS = [{ value: "", label: "All dates" }, ...PERIODS];
const OPERATION_OPTIONS = [{ value: "", label: "All operations" }, ...OPERATIONS.map((o) => ({ value: o, label: o }))];
const PERSON_OPTIONS = [{ value: "", label: "All people" }, ...PEOPLE.map((p) => ({ value: p, label: p }))];

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <Text component="dt" size="sm" c="dimmed">
        {term}
      </Text>
      <Text component="dd" m={0} fw={500}>
        {children}
      </Text>
    </div>
  );
}

// Token Usage (U-35): where the tokens went, by date, person and operation. An admin sees the whole workspace and can
// filter by person; a user sees only their own rows. The figures are the seeded ones from My Plan, so a top-up made
// there does not show up here. The filters live in this component only.
export function TokenUsageScreen() {
  const session = useSession();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so clear the filters then: every visit starts unfiltered.
  useEffect(() => () => setFilters(NO_FILTERS), []);

  // Wait for the session: the stand-in role is admin, so a user would otherwise see the whole workspace for a moment.
  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
  const isAdmin = role === "admin";
  // Signed out (only possible with AUTH_REQUIRED=false) as a user: show the built-in user's rows.
  const ownEmail = session?.email ?? "user@tcg.test";

  const mine = isAdmin ? SEED_USAGE : SEED_USAGE.filter((e) => e.email === ownEmail);
  const shown = filterUsage(mine, filters);
  const consumed = sumTokens(mine);
  const columns = isAdmin ? ["Date", "Person", "Operation", "Tokens"] : ["Date", "Operation", "Tokens"];

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>Token Usage</Title>
      <Text c="dimmed">Where your tokens went, by date, person and operation.</Text>

      {role !== undefined && (
        <>
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>Summary</Title>
              <Box component="dl" m={0}>
                <Group gap="xl">
                  {isAdmin ? (
                    <>
                      <Fact term="Tokens added">{formatTokens(SEED_ALLOWANCE)}</Fact>
                      <Fact term="Tokens consumed">{formatTokens(consumed)}</Fact>
                      <Fact term="Tokens remaining">{formatTokens(SEED_ALLOWANCE - consumed)}</Fact>
                    </>
                  ) : (
                    <Fact term="Tokens you consumed">{formatTokens(consumed)}</Fact>
                  )}
                  <Fact term="Total in view">{formatTokens(sumTokens(shown))}</Fact>
                </Group>
              </Box>
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>Usage log</Title>
              <Group align="flex-end">
                <NativeSelect
                  label="Period"
                  data={PERIOD_OPTIONS}
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.currentTarget.value })}
                />
                <NativeSelect
                  label="Operation"
                  data={OPERATION_OPTIONS}
                  value={filters.operation}
                  onChange={(e) => setFilters({ ...filters, operation: e.currentTarget.value })}
                />
                {isAdmin && (
                  <NativeSelect
                    label="Person"
                    data={PERSON_OPTIONS}
                    value={filters.person}
                    onChange={(e) => setFilters({ ...filters, person: e.currentTarget.value })}
                  />
                )}
                <Button variant="default" disabled={!hasFilters(filters)} onClick={() => setFilters(NO_FILTERS)}>
                  Clear filters
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                Showing {shown.length} of {mine.length} entries
              </Text>

              {shown.length === 0 ? (
                <Text>No usage matches these filters.</Text>
              ) : (
                <Table.ScrollContainer minWidth={isAdmin ? 560 : 420}>
                  <Table withTableBorder striped aria-label="Token usage">
                    <Table.Thead>
                      <Table.Tr>
                        {columns.map((column) => (
                          // scope="col" is what makes the browser expose these as column headers (see the Projects table).
                          <Table.Th key={column} scope="col" ta={column === "Tokens" ? "right" : undefined}>
                            {column}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {shown.map((e) => (
                        <Table.Tr key={e.id}>
                          <Table.Td>{e.date}</Table.Td>
                          {isAdmin && <Table.Td>{e.person}</Table.Td>}
                          <Table.Td>{e.operation}</Table.Td>
                          <Table.Td ta="right">{formatTokens(e.tokens)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
