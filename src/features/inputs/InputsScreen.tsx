"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Group, Modal, NativeSelect, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useSession } from "@/components/auth/useSession";
import { AddInputForm } from "./AddInputForm";
import {
  emptyMessage,
  INPUT_TYPES,
  matchesInput,
  SEED_INPUTS,
  type InputDraft,
  type InputType,
  type RegistryInput,
} from "./data";

const TYPE_COLOR: Record<InputType, string> = { Document: "blue", Jira: "indigo", URL: "teal", "Typed text": "gray" };
const TYPE_FILTER_OPTIONS = [{ value: "", label: "All types" }, ...INPUT_TYPES.map((t) => ({ value: t, label: t }))];
const COLUMNS = ["Name", "Type", "Project", "Source", "Added by", "Version", "Added"];

// The Inputs Registry (U-25, U-27): the requirements inputs in the workspace, with a search, a type filter and an Add
// input dialog whose Source rule depends on the type. Versioning, preview and the per-project view are still to build.
// The list lives in this component only, so a full reload goes back to the seed.
export function InputsScreen() {
  const session = useSession();
  const [inputs, setInputs] = useState<RegistryInput[]>(SEED_INPUTS);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<InputType | "">("");
  const [added, setAdded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so go back to the seeded list, an empty search and every type, with the
  // dialog closed and no status, then.
  useEffect(
    () => () => {
      setInputs(SEED_INPUTS);
      setQuery("");
      setType("");
      setAdded(null);
      setDialogOpen(false);
    },
    [],
  );

  const shown = inputs.filter((i) => matchesInput(i, query) && (!type || i.type === type));

  function onAdd(draft: InputDraft) {
    const name = draft.name.trim();
    const input: RegistryInput = {
      id: crypto.randomUUID(),
      name,
      // validateInput guarantees a type and a project before this runs
      type: draft.type as InputType,
      project: draft.project,
      source: draft.source.trim(),
      addedBy: session?.name ?? "You",
      version: "v1",
      added: "Just now",
    };
    setInputs([input, ...inputs]);
    setAdded(name);
    closeDialog();
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>Inputs Registry</Title>
        <Button onClick={openDialog}>Add input</Button>
      </Group>
      <Text c="dimmed">Every requirements input in the workspace, filed under a project.</Text>

      {added && (
        <Alert color="green" title="Input added" role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setAdded(null)}>
          &quot;{added}&quot; was added to the list.
        </Alert>
      )}

      <Group align="flex-end">
        <TextInput
          label="Search inputs"
          placeholder="Name, project or source"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <NativeSelect
          label="Filter by type"
          data={TYPE_FILTER_OPTIONS}
          value={type}
          onChange={(e) => setType(e.currentTarget.value as InputType | "")}
        />
      </Group>
      <Text size="sm" c="dimmed">
        Showing {shown.length} of {inputs.length} inputs
      </Text>

      {shown.length === 0 ? (
        <Text>{emptyMessage(query, type)}</Text>
      ) : (
        <Table.ScrollContainer minWidth={820}>
          <Table withTableBorder striped aria-label="Inputs">
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
              {shown.map((i) => (
                <Table.Tr key={i.id}>
                  <Table.Td>{i.name}</Table.Td>
                  <Table.Td>
                    {/* tt="none": Badge capitalises by default, so the screen would say "URL" for "Url" and "TYPED TEXT". */}
                    <Badge color={TYPE_COLOR[i.type]} variant="light" tt="none">
                      {i.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{i.project}</Table.Td>
                  <Table.Td>{i.source}</Table.Td>
                  <Table.Td>{i.addedBy}</Table.Td>
                  <Table.Td>{i.version}</Table.Td>
                  <Table.Td>{i.added}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal opened={dialogOpen} onClose={closeDialog} title="Add input">
        <AddInputForm existing={inputs} onAdd={onAdd} onCancel={closeDialog} />
      </Modal>
    </Stack>
  );
}
