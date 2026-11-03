"use client";

import { useState } from "react";
import { Alert, Badge, Button, Group, Modal, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSession } from "@/components/auth/useSession";
import { NewProjectForm } from "./NewProjectForm";
import { matchesQuery, SEED_PROJECTS, type Project, type ProjectDraft, type ProjectStatus } from "./data";

const STATUS_COLOR: Record<ProjectStatus, string> = { Active: "green", "On hold": "yellow", Archived: "gray" };

const COLUMNS = ["Name", "Code", "Department", "Created by", "Inputs", "Outputs", "Runs", "Last activity", "Status"];

// The Projects list (U-24, U-42, A-26): search, and a New project dialog. Editing, the status change and the project's
// own tabs (U-45) are still to build. The list lives in this component only, so a full reload goes back to the seed.
export function ProjectsScreen() {
  const session = useSession();
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [query, setQuery] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [dialogOpen, { open: openDialog, close: closeDialog }] = useDisclosure(false);

  const shown = projects.filter((p) => matchesQuery(p, query));

  function onCreate(draft: ProjectDraft) {
    const name = draft.name.trim();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      code: draft.code.trim(),
      // validateDraft guarantees a department before this runs
      department: draft.department as Project["department"],
      creator: session?.name ?? "You",
      description: draft.description.trim(),
      inputs: 0,
      outputs: 0,
      runs: 0,
      lastActivity: "Just now",
      status: draft.status,
    };
    setProjects([project, ...projects]);
    setCreated(name);
    closeDialog();
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>Projects</Title>
        <Button onClick={openDialog}>New project</Button>
      </Group>
      <Text c="dimmed">The projects your runs and documents are filed under.</Text>

      {created && (
        <Alert color="green" title="Project created" role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setCreated(null)}>
          &quot;{created}&quot; was added to the list.
        </Alert>
      )}

      <TextInput
        label="Search projects"
        placeholder="Name, code, department or creator"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />
      <Text size="sm" c="dimmed">
        Showing {shown.length} of {projects.length} projects
      </Text>

      {shown.length === 0 ? (
        <Text>No projects match &quot;{query.trim()}&quot;.</Text>
      ) : (
        <Table.ScrollContainer minWidth={820}>
          <Table withTableBorder striped aria-label="Projects">
            <Table.Thead>
              <Table.Tr>
                {COLUMNS.map((column) => (
                  // scope="col" is what makes the browser expose these as column headers: a bare <th> in this table
                  // showed up in the accessibility tree as an ordinary cell.
                  <Table.Th key={column} scope="col">
                    {column}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {shown.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>{p.code}</Table.Td>
                  <Table.Td>{p.department}</Table.Td>
                  <Table.Td>{p.creator}</Table.Td>
                  <Table.Td>{p.inputs}</Table.Td>
                  <Table.Td>{p.outputs}</Table.Td>
                  <Table.Td>{p.runs}</Table.Td>
                  <Table.Td>{p.lastActivity}</Table.Td>
                  <Table.Td>
                    {/* tt="none": Badge capitalises by default, so the screen would say "ACTIVE" while the page text and the
                        accessibility tree say "Active", and a test reading the screen would disagree with one reading the DOM. */}
                    <Badge color={STATUS_COLOR[p.status]} variant="light" tt="none">
                      {p.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <Modal opened={dialogOpen} onClose={closeDialog} title="New project">
        <NewProjectForm existing={projects} onCreate={onCreate} onCancel={closeDialog} />
      </Modal>
    </Stack>
  );
}
