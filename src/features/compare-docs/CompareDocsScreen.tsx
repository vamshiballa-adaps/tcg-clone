"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Group, List, NativeSelect, Paper, Stack, Text, Title } from "@mantine/core";
import {
  BLANK_DRAFT,
  diffVersions,
  DOCUMENTS,
  isEmptyDiff,
  validateCompare,
  VERSIONS,
  type CompareDraft,
  type CompareErrors,
  type Diff,
  type Version,
} from "./data";

const DOCUMENT_OPTIONS = [{ value: "", label: "Select a document" }, ...DOCUMENTS.map((d) => ({ value: d.name, label: d.name }))];
const VERSION_OPTIONS = [{ value: "", label: "Select a version" }, ...VERSIONS.map((v) => ({ value: v, label: v }))];

interface Report {
  document: string;
  from: Version;
  to: Version;
  diff: Diff;
}

// Compare Docs (U-28): pick a document and two of its versions and read what was added, removed and modified between
// them. The versions are seeded and the passages are matched by reference (R1, R2, ...); nothing is sent anywhere. The
// report always matches what is selected: changing a selection removes it. State lives in this component only.
export function CompareDocsScreen() {
  const [draft, setDraft] = useState<CompareDraft>(BLANK_DRAFT);
  const [errors, setErrors] = useState<CompareErrors>({});
  const [report, setReport] = useState<Report | null>(null);
  const documentRef = useRef<HTMLSelectElement>(null);
  const fromRef = useRef<HTMLSelectElement>(null);
  const toRef = useRef<HTMLSelectElement>(null);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so wipe the form and the report then: every visit starts blank.
  useEffect(
    () => () => {
      setDraft(BLANK_DRAFT);
      setErrors({});
      setReport(null);
    },
    [],
  );

  function change(next: CompareDraft) {
    setDraft(next);
    setReport(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateCompare(draft);
    setErrors(found);
    if (found.document) return documentRef.current?.focus();
    if (found.from) return fromRef.current?.focus();
    if (found.to) return toRef.current?.focus();
    // validateCompare guarantees a document and two versions before this runs
    const doc = DOCUMENTS.find((d) => d.name === draft.document);
    if (!doc) return;
    const from = draft.from as Version;
    const to = draft.to as Version;
    setReport({ document: doc.name, from, to, diff: diffVersions(doc.versions[from], doc.versions[to]) });
  }

  return (
    <Stack gap="md" maw={760}>
      <Title order={2}>Compare Docs</Title>
      <Text c="dimmed">See what changed between two versions of a document.</Text>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Title order={3}>Compare two versions</Title>
          <form onSubmit={onSubmit} noValidate>
            <Stack gap="sm">
              <Group align="flex-start">
                <NativeSelect
                  ref={documentRef}
                  label="Document"
                  name="document"
                  data={DOCUMENT_OPTIONS}
                  value={draft.document}
                  onChange={(e) => change({ ...draft, document: e.currentTarget.value })}
                  error={errors.document}
                />
                <NativeSelect
                  ref={fromRef}
                  label="From version"
                  name="from-version"
                  data={VERSION_OPTIONS}
                  value={draft.from}
                  onChange={(e) => change({ ...draft, from: e.currentTarget.value as Version | "" })}
                  error={errors.from}
                />
                <NativeSelect
                  ref={toRef}
                  label="To version"
                  name="to-version"
                  data={VERSION_OPTIONS}
                  value={draft.to}
                  onChange={(e) => change({ ...draft, to: e.currentTarget.value as Version | "" })}
                  error={errors.to}
                />
              </Group>
              <Group>
                <Button type="submit">Compare versions</Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>

      {report && (
        <Paper withBorder p="md">
          <Stack gap="sm">
            <Title order={3}>Comparison report</Title>
            <Text fw={500}>
              {report.document}: {report.from} to {report.to}
            </Text>
            <Text role="status">
              {report.diff.added.length} added, {report.diff.removed.length} removed, {report.diff.modified.length} modified.
            </Text>
            {isEmptyDiff(report.diff) ? (
              <Text>No differences between these versions.</Text>
            ) : (
              <>
                <Title order={4}>Added ({report.diff.added.length})</Title>
                {report.diff.added.length === 0 ? (
                  <Text>None.</Text>
                ) : (
                  <List>
                    {report.diff.added.map((x) => (
                      <List.Item key={x.ref}>
                        {x.ref}: {x.text}
                      </List.Item>
                    ))}
                  </List>
                )}
                <Title order={4}>Removed ({report.diff.removed.length})</Title>
                {report.diff.removed.length === 0 ? (
                  <Text>None.</Text>
                ) : (
                  <List>
                    {report.diff.removed.map((x) => (
                      <List.Item key={x.ref}>
                        {x.ref}: {x.text}
                      </List.Item>
                    ))}
                  </List>
                )}
                <Title order={4}>Modified ({report.diff.modified.length})</Title>
                {report.diff.modified.length === 0 ? (
                  <Text>None.</Text>
                ) : (
                  <List>
                    {report.diff.modified.map((x) => (
                      <List.Item key={x.ref}>
                        <Text fw={600}>{x.ref}</Text>
                        <Text>Before: {x.before}</Text>
                        <Text>After: {x.after}</Text>
                      </List.Item>
                    ))}
                  </List>
                )}
              </>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
