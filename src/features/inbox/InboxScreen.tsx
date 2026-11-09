"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Group, Paper, Radio, Stack, Text, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import type { Role } from "@/lib/role";
import { applyFilter, countUnread, messagesFor, type Message, type MessageFilter } from "./data";

// My Inbox (U-29 to U-33): the messages waiting on the signed-in person. The admin and the user are sent different
// messages. Reading is the only action (no delete): each unread message has a button, and "Mark all as read" clears
// the rest. Nothing is saved. State lives in this component only.
export function InboxScreen() {
  const session = useSession();
  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>My Inbox</Title>
      <Text c="dimmed">Messages waiting on you.</Text>
      {/* Waits for the session: which messages exist depends on the role, so nothing is drawn from the wrong list. */}
      {session && <Messages key={session.role} role={session.role} />}
    </Stack>
  );
}

function Messages({ role }: { role: Role }) {
  const [messages, setMessages] = useState<Message[]>(() => messagesFor(role));
  const [filter, setFilter] = useState<MessageFilter>("all");
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so make every message unread again and show all of them then.
  useEffect(
    () => () => {
      setMessages(messagesFor(role));
      setFilter("all");
    },
    [role],
  );

  const unread = countUnread(messages);
  const shown = applyFilter(messages, filter);

  // A marked message can leave the list (under "Unread only") and take the focused button with it, so focus goes to the
  // "Messages" heading after any marking.
  function markRead(ids: string[]) {
    setMessages((current) => current.map((m) => (ids.includes(m.id) ? { ...m, unread: false } : m)));
    headingRef.current?.focus();
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end">
        <Radio.Group label="Show" name="show" value={filter} onChange={(value) => setFilter(value as MessageFilter)}>
          <Group mt="xs">
            <Radio value="all" label="All messages" />
            <Radio value="unread" label="Unread only" />
          </Group>
        </Radio.Group>
        <Button variant="default" disabled={unread === 0} onClick={() => markRead(messages.map((m) => m.id))}>
          Mark all as read
        </Button>
      </Group>

      <Text role="status" size="sm" fw={500}>
        {unread} unread
      </Text>

      <Stack gap="sm">
        <Title order={3} ref={headingRef} tabIndex={-1}>
          Messages
        </Title>
        <Text size="sm" c="dimmed">
          Showing {shown.length} of {messages.length} messages
        </Text>

        {shown.length === 0 ? (
          <Text>No unread messages.</Text>
        ) : (
          <Stack component="ul" gap="sm" m={0} p={0} style={{ listStyle: "none" }}>
            {shown.map((m) => (
              <li key={m.id}>
                <Paper withBorder p="md">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2}>
                      <Group gap="xs">
                        {/* tt="none": Badge capitalises by default, so the screen would say "UNREAD" while the DOM says "Unread". */}
                        {m.unread && (
                          <Badge color="blue" variant="light" tt="none">
                            Unread
                          </Badge>
                        )}
                        <Text fw={m.unread ? 700 : 500}>{m.title}</Text>
                      </Group>
                      <Text size="sm">{m.body}</Text>
                      <Text size="xs" c="dimmed">
                        Received {m.received}
                      </Text>
                    </Stack>
                    {/* The name carries the message title: ten identical "Mark as read" buttons could not be told apart. */}
                    {m.unread && (
                      <Button size="xs" variant="light" aria-label={`Mark as read: ${m.title}`} onClick={() => markRead([m.id])}>
                        Mark as read
                      </Button>
                    )}
                  </Group>
                </Paper>
              </li>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
