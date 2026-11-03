"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, NativeSelect, Radio, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import {
  BLANK_DRAFT,
  FEEDBACK_AREAS,
  FEEDBACK_KINDS,
  validateFeedback,
  type FeedbackArea,
  type FeedbackDraft,
  type FeedbackErrors,
  type FeedbackKind,
} from "./data";

const AREA_OPTIONS = [{ value: "", label: "Select an area" }, ...FEEDBACK_AREAS.map((a) => ({ value: a, label: a }))];

interface Sent {
  kind: FeedbackKind;
  area: FeedbackArea;
  subject: string;
}

// Help & Feedback (U-39): report a problem, an idea or a question, filed under an area. There is no inbox behind this
// test app, so sending only checks the form and confirms; nothing is stored.
export function HelpScreen() {
  const [draft, setDraft] = useState<FeedbackDraft>(BLANK_DRAFT);
  const [errors, setErrors] = useState<FeedbackErrors>({});
  const [sent, setSent] = useState<Sent | null>(null);
  const firstKindRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLSelectElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so wipe the form then: every visit starts blank instead of showing last
  // visit's confirmation or a half-typed message.
  useEffect(
    () => () => {
      setDraft(BLANK_DRAFT);
      setErrors({});
      setSent(null);
    },
    [],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateFeedback(draft);
    setErrors(found);
    if (found.kind) return firstKindRef.current?.focus();
    if (found.area) return areaRef.current?.focus();
    if (found.subject) return subjectRef.current?.focus();
    if (found.details) return detailsRef.current?.focus();
    // validateFeedback guarantees a kind and an area before this runs
    setSent({ kind: draft.kind as FeedbackKind, area: draft.area as FeedbackArea, subject: draft.subject.trim() });
  }

  function sendAnother() {
    setDraft(BLANK_DRAFT);
    setErrors({});
    setSent(null);
  }

  return (
    <Stack gap="md" maw={560}>
      <Title order={2}>Help &amp; Feedback</Title>
      <Text c="dimmed">
        Tell us about a problem, an idea or a question, and pick the area it is about so it reaches the right people.
      </Text>

      {sent ? (
        <Stack>
          <Alert color="green" title="Feedback sent" role="status">
            Your {sent.kind.toLowerCase()} about {sent.area} was sent: &quot;{sent.subject}&quot;.
          </Alert>
          <Group>
            <Button variant="default" onClick={sendAnother}>
              Send more feedback
            </Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack>
            <Radio.Group
              label="Kind"
              name="kind"
              value={draft.kind}
              onChange={(value) => setDraft({ ...draft, kind: value as FeedbackKind })}
              error={errors.kind}
            >
              <Group mt="xs">
                {FEEDBACK_KINDS.map((kind, i) => (
                  <Radio key={kind} ref={i === 0 ? firstKindRef : undefined} value={kind} label={kind} />
                ))}
              </Group>
            </Radio.Group>
            <NativeSelect
              ref={areaRef}
              label="Area"
              name="area"
              data={AREA_OPTIONS}
              value={draft.area}
              onChange={(e) => setDraft({ ...draft, area: e.currentTarget.value as FeedbackArea | "" })}
              error={errors.area}
            />
            <TextInput
              ref={subjectRef}
              label="Subject"
              name="subject"
              autoComplete="off"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.currentTarget.value })}
              error={errors.subject}
            />
            <Textarea
              ref={detailsRef}
              label="Details"
              name="details"
              autosize
              minRows={4}
              value={draft.details}
              onChange={(e) => setDraft({ ...draft, details: e.currentTarget.value })}
              error={errors.details}
            />
            <Group>
              <Button type="submit">Send feedback</Button>
            </Group>
          </Stack>
        </form>
      )}
    </Stack>
  );
}
