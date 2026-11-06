"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Group, Paper, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import {
  activeDays,
  busiestDay,
  DEFAULT_RANGE,
  entriesInRange,
  entryMinutes,
  formatMinutes,
  sameRange,
  SEED_TIME,
  totalMinutes,
  validateRange,
  type DateRange,
  type RangeErrors,
} from "./data";

const COLUMNS = ["Date", "Started", "Ended", "Area", "Duration"];

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

// My TCG Time (U-36): the minutes you spent on the platform over a date range. Always your own, for both roles (Team
// Activity is the screen that looks across people). The range is only applied by "Apply range", and only when both
// dates pass; until then the table keeps showing the last good range. State lives in this component only.
export function MyTimeScreen() {
  const session = useSession();
  const [draft, setDraft] = useState<DateRange>(DEFAULT_RANGE);
  const [applied, setApplied] = useState<DateRange>(DEFAULT_RANGE);
  const [errors, setErrors] = useState<RangeErrors>({});
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the default range then: every visit starts the same.
  useEffect(
    () => () => {
      setDraft(DEFAULT_RANGE);
      setApplied(DEFAULT_RANGE);
      setErrors({});
    },
    [],
  );

  function onApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateRange(draft);
    setErrors(found);
    if (found.from) return fromRef.current?.focus();
    if (found.to) return toRef.current?.focus();
    const range = { from: draft.from.trim(), to: draft.to.trim() };
    setDraft(range);
    setApplied(range);
  }

  function onReset() {
    setDraft(DEFAULT_RANGE);
    setApplied(DEFAULT_RANGE);
    setErrors({});
  }

  // Wait for the session: whose rows to show depends on it, and the stand-in is not a real person.
  // Signed out (only possible with AUTH_REQUIRED=false) as a user: show the built-in user's rows.
  const ownEmail = session === undefined ? undefined : (session?.email ?? "user@tcg.test");
  const mine = ownEmail === undefined ? [] : SEED_TIME.filter((e) => e.email === ownEmail);
  const shown = entriesInRange(mine, applied);
  const busiest = busiestDay(shown);
  const atDefault = sameRange(draft, DEFAULT_RANGE) && sameRange(applied, DEFAULT_RANGE);

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>My TCG Time</Title>
      <Text c="dimmed">The time you spent on the platform, session by session, over a range of dates.</Text>

      {ownEmail !== undefined && (
        <>
          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>Date range</Title>
              <form onSubmit={onApply} noValidate>
                <Stack gap="sm">
                  <Group align="flex-start">
                    <TextInput
                      ref={fromRef}
                      label="Start date"
                      name="start-date"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      value={draft.from}
                      onChange={(e) => setDraft({ ...draft, from: e.currentTarget.value })}
                      error={errors.from}
                    />
                    <TextInput
                      ref={toRef}
                      label="End date"
                      name="end-date"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      value={draft.to}
                      onChange={(e) => setDraft({ ...draft, to: e.currentTarget.value })}
                      error={errors.to}
                    />
                  </Group>
                  <Group>
                    <Button type="submit">Apply range</Button>
                    <Button variant="default" disabled={atDefault && !errors.from && !errors.to} onClick={onReset}>
                      Reset range
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>Summary</Title>
              <Box component="dl" m={0}>
                <Group gap="xl">
                  <Fact term="Total time">{formatMinutes(totalMinutes(shown))}</Fact>
                  <Fact term="Days with activity">{activeDays(shown)}</Fact>
                  <Fact term="Busiest day">
                    {busiest ? `${busiest.date} (${formatMinutes(busiest.minutes)})` : "None"}
                  </Fact>
                </Group>
              </Box>
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Stack gap="sm">
              <Title order={3}>Time log</Title>
              <Text size="sm" c="dimmed" aria-live="polite">
                Showing {shown.length} of {mine.length} sessions from {applied.from} to {applied.to}
              </Text>

              {shown.length === 0 ? (
                <Text>No time recorded in this range.</Text>
              ) : (
                <Table.ScrollContainer minWidth={520}>
                  <Table withTableBorder striped aria-label="Time log">
                    <Table.Thead>
                      <Table.Tr>
                        {COLUMNS.map((column) => (
                          // scope="col" is what makes the browser expose these as column headers (see the Projects table).
                          <Table.Th key={column} scope="col" ta={column === "Duration" ? "right" : undefined}>
                            {column}
                          </Table.Th>
                        ))}
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {shown.map((e) => (
                        <Table.Tr key={e.id}>
                          <Table.Td>{e.date}</Table.Td>
                          <Table.Td>{e.start}</Table.Td>
                          <Table.Td>{e.end}</Table.Td>
                          <Table.Td>{e.area}</Table.Td>
                          <Table.Td ta="right">{formatMinutes(entryMinutes(e))}</Table.Td>
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
