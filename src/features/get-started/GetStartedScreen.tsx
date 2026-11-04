"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Group, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import { TOUR_STEPS } from "./steps";

const LAST = TOUR_STEPS.length - 1;

// Get Started (U-38): a five-step tour of how a run goes from requirements to test results. Back, Next and Finish move
// through it; the step list is not clickable, so those buttons are the only way. Nothing is saved: the tour starts at
// step 1 on every visit.
export function GetStartedScreen() {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the start then: every visit begins at step 1 instead of
  // wherever the last one stopped.
  useEffect(
    () => () => {
      setIndex(0);
      setFinished(false);
    },
    [],
  );

  const step = TOUR_STEPS[index];
  const position = finished ? TOUR_STEPS.length : index + 1;

  function startOver() {
    setIndex(0);
    setFinished(false);
  }

  return (
    <Stack gap="md" maw={640}>
      <Title order={2}>Get Started</Title>
      <Text c="dimmed">A five-step tour of how a run goes from requirements to test results.</Text>

      <Progress value={(position / TOUR_STEPS.length) * 100} aria-label="Tour progress" />
      <Text size="sm" aria-live="polite">
        {finished ? "Tour finished" : `Step ${position} of ${TOUR_STEPS.length}`}
      </Text>

      <Box component="ol" m={0} pl="lg">
        {TOUR_STEPS.map((s, i) => (
          <li key={s.label} aria-current={!finished && i === index ? "step" : undefined}>
            <Text span fw={!finished && i === index ? 700 : 400} c={!finished && i === index ? undefined : "dimmed"}>
              {s.label}
            </Text>
          </li>
        ))}
      </Box>

      {finished ? (
        <Stack>
          <Alert color="green" title="Tour complete" role="status">
            You have seen all {TOUR_STEPS.length} steps. You can start over any time.
          </Alert>
          <Group>
            <Button variant="default" onClick={startOver}>
              Start over
            </Button>
          </Group>
        </Stack>
      ) : (
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={3}>{step.title}</Title>
            <Text>{step.text}</Text>
            <Group justify="space-between" mt="xs">
              <Button variant="default" onClick={() => setIndex(index - 1)} disabled={index === 0}>
                Back
              </Button>
              {index < LAST ? (
                <Button onClick={() => setIndex(index + 1)}>Next</Button>
              ) : (
                <Button onClick={() => setFinished(true)}>Finish</Button>
              )}
            </Group>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
