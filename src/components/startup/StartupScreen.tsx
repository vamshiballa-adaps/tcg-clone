"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { Anchor, Box, Image, List, Paper, Stack, Text } from "@mantine/core";
import {
  RENDER_URL,
  STARTUP_ENABLED,
  STARTUP_HOLD_MS,
  STARTUP_LINES,
  STARTUP_STEP_MS,
} from "@/config/startup";
import classes from "./startup.module.css";

const noopSubscribe = () => () => {};

// Models a cold start on the Home screen. Loading Home from scratch shows an "Application loading" alert whose startup
// log builds up line by line and ends with "Your app is almost live", then gives way to the real screen. While it is
// up, the CSS next to it takes the app shell out of the accessibility tree (see startup.module.css). Rendered on the
// server too, so the first paint is already the loading screen.
export function StartupScreen() {
  // false while the server HTML is being hydrated, true for a component that mounts later (a client-side navigation).
  // Only a mount during hydration is a cold start; reaching Home from another page by a link is not.
  const afterHydration = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [ready, setReady] = useState(() => !STARTUP_ENABLED || afterHydration);
  const [visible, setVisible] = useState(1);
  const titleId = useId();

  useEffect(() => {
    if (ready) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STARTUP_LINES.length; i++) {
      timers.push(setTimeout(() => setVisible(i + 1), i * STARTUP_STEP_MS));
    }
    const done = (STARTUP_LINES.length - 1) * STARTUP_STEP_MS + STARTUP_HOLD_MS;
    timers.push(setTimeout(() => setReady(true), done));
    return () => timers.forEach(clearTimeout);
  }, [ready]);

  if (ready) return null;

  return (
    <Box data-startup-screen className={classes.screen}>
      <Stack maw={560} mx="auto" p="xl" gap="lg">
        <Anchor href={RENDER_URL} w="fit-content">
          <Image src="/render-logo.svg" alt="Render Logo" h={32} w="auto" />
        </Anchor>

        {/* aria-atomic=false so a screen reader announces each new line, not the whole log again. */}
        <Paper role="alert" aria-atomic="false" aria-labelledby={titleId} withBorder p="md">
          <Text id={titleId} fw={600}>
            Application loading
          </Text>
          <List listStyleType="none" spacing={4} mt="xs" aria-label="Startup log">
            {STARTUP_LINES.slice(0, visible).map((line, i) => (
              <List.Item key={line} fw={i === STARTUP_LINES.length - 1 ? 600 : 400}>
                {line}
              </List.Item>
            ))}
          </List>
        </Paper>

        <Anchor href={RENDER_URL}>Start building on Render today</Anchor>
      </Stack>
    </Box>
  );
}
