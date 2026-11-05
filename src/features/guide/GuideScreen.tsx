"use client";

import { useEffect, useState } from "react";
import { Accordion, Box, Paper, Stack, Tabs, Text, TextInput, Title } from "@mantine/core";
import { filterGlossary, GLOSSARY, GUIDE_STAGES, STANDARDS } from "./data";

const FIRST_TAB = "pipeline";

// Guide (U-38): the pipeline stage by stage, the standards behind it and a small glossary. Read-only content with three
// controls worth testing: tabs, an accordion that keeps one stage open at a time, and a glossary search. All state lives
// in this component only.
export function GuideScreen() {
  const [tab, setTab] = useState<string>(FIRST_TAB);
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the first tab, closed stages and an empty search then.
  useEffect(
    () => () => {
      setTab(FIRST_TAB);
      setOpenStage(null);
      setQuery("");
    },
    [],
  );

  const terms = filterGlossary(GLOSSARY, query);

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>Guide</Title>
      <Text c="dimmed">How a run goes from requirements to test results, and the standards it follows.</Text>

      {/* keepMounted off: only the open tab's content is in the page, so nothing hidden can answer a locator. */}
      <Tabs value={tab} onChange={(value) => setTab(value ?? FIRST_TAB)} keepMounted={false}>
        <Tabs.List aria-label="Guide sections">
          <Tabs.Tab value="pipeline">Pipeline</Tabs.Tab>
          <Tabs.Tab value="standards">Standards</Tabs.Tab>
          <Tabs.Tab value="glossary">Glossary</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pipeline" pt="md">
          <Stack gap="sm">
            <Title order={3}>Pipeline at a glance</Title>
            <Text size="sm" c="dimmed">
              Open a stage to read what it does. Only one stage is open at a time.
            </Text>
            <Accordion value={openStage} onChange={setOpenStage} variant="separated">
              {GUIDE_STAGES.map((stage) => (
                <Accordion.Item key={stage.value} value={stage.value}>
                  <Accordion.Control>{stage.label}</Accordion.Control>
                  <Accordion.Panel>{stage.summary}</Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="standards" pt="md">
          <Stack gap="sm">
            <Title order={3}>Standards the platform follows</Title>
            <Paper withBorder p="md">
              <Box component="dl" m={0}>
                <Stack gap="md">
                  {STANDARDS.map((s) => (
                    <div key={s.name}>
                      <Text component="dt" fw={600}>
                        {s.name}
                      </Text>
                      <Text component="dd" m={0}>
                        {s.text}
                      </Text>
                    </div>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="glossary" pt="md">
          <Stack gap="sm">
            <Title order={3}>Glossary</Title>
            <TextInput
              label="Search glossary"
              name="glossary-search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
            <Text size="sm" c="dimmed" aria-live="polite">
              Showing {terms.length} of {GLOSSARY.length} terms
            </Text>
            {terms.length === 0 ? (
              <Text>No terms match &quot;{query.trim()}&quot;.</Text>
            ) : (
              <Paper withBorder p="md">
                <Box component="dl" m={0}>
                  <Stack gap="md">
                    {terms.map((t) => (
                      <div key={t.term}>
                        <Text component="dt" fw={600}>
                          {t.term}
                        </Text>
                        <Text component="dd" m={0}>
                          {t.meaning}
                        </Text>
                      </div>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
