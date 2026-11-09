"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Box, Button, Group, NativeSelect, Paper, Stack, Table, Text, Title } from "@mantine/core";
import {
  fullSuiteTrigger,
  hasQueuedOnDemand,
  SEED_TRIGGERS,
  TRIGGER_RESULTS,
  TRIGGER_SETTINGS,
  type Trigger,
  type TriggerResult,
} from "./data";

const RESULT_COLOR: Record<TriggerResult, string> = { Passed: "green", Failed: "red", Queued: "blue" };
const RESULT_OPTIONS = [{ value: "", label: "All results" }, ...TRIGGER_RESULTS.map((r) => ({ value: r, label: r }))];
const COLUMNS = ["Run", "Source", "Trigger", "Test cases selected", "Result", "When"];

// CI/CD Automation (A-20, A-21), Admin only (the proxy shows "Access denied" to a user at this same address): the trigger
// settings, an on-demand full-suite run and the history of triggers. Connecting a method, pausing and the fallback
// settings are still to build. The history lives in this component only, so a full reload goes back to the seed.
export function CicdScreen() {
  const [history, setHistory] = useState<Trigger[]>(SEED_TRIGGERS);
  const [result, setResult] = useState<TriggerResult | "">("");
  const [queued, setQueued] = useState<number | null>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the five seeded triggers, every result and no status then.
  useEffect(
    () => () => {
      setHistory(SEED_TRIGGERS);
      setResult("");
      setQueued(null);
    },
    [],
  );

  const shown = history.filter((t) => !result || t.result === result);
  const waiting = hasQueuedOnDemand(history);

  function runFullSuite() {
    const trigger = fullSuiteTrigger(history);
    setHistory([trigger, ...history]);
    setQueued(trigger.run);
  }

  return (
    <Stack gap="md">
      <Title order={2}>CI/CD Automation</Title>
      <Text c="dimmed">Test runs started by a merged pull request, or on demand.</Text>

      {queued !== null && (
        <Alert color="green" title="Full suite queued" role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setQueued(null)}>
          Run {queued} was queued for all 18 test cases.
        </Alert>
      )}

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Title order={3}>Trigger settings</Title>
          <Box component="dl" m={0}>
            <Stack gap="xs">
              {TRIGGER_SETTINGS.map((s) => (
                <Group key={s.term} gap="xs" wrap="nowrap" align="baseline">
                  <Text component="dt" fw={600} w={120}>
                    {s.term}
                  </Text>
                  <Text component="dd" m={0}>
                    {s.detail}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Title order={3}>On demand</Title>
          <Text size="sm">Run every test case without waiting for a code change.</Text>
          <Group>
            <Button onClick={runFullSuite} disabled={waiting}>
              Run full suite
            </Button>
            {waiting && (
              <Text size="sm" c="dimmed">
                A full suite is already queued.
              </Text>
            )}
          </Group>
        </Stack>
      </Paper>

      <Stack gap="sm">
        <Title order={3}>Trigger history</Title>
        <Group align="flex-end">
          <NativeSelect label="Filter by result" data={RESULT_OPTIONS} value={result} onChange={(e) => setResult(e.currentTarget.value as TriggerResult | "")} />
        </Group>
        <Text size="sm" c="dimmed">
          Showing {shown.length} of {history.length} triggers
        </Text>
        <Table.ScrollContainer minWidth={760}>
          <Table withTableBorder striped aria-label="Trigger history">
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
              {shown.map((t) => (
                <Table.Tr key={t.run}>
                  <Table.Td>{t.run}</Table.Td>
                  <Table.Td>{t.source}</Table.Td>
                  <Table.Td>{t.trigger}</Table.Td>
                  <Table.Td>{t.selected}</Table.Td>
                  <Table.Td>
                    {/* tt="none": Badge capitalises by default, so the screen would say "PASSED" while the DOM says "Passed". */}
                    <Badge color={RESULT_COLOR[t.result]} variant="light" tt="none">
                      {t.result}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t.when}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Stack>
  );
}
