"use client";

import { useRef, useState } from "react";
import { Button, Group, NativeSelect, Stack, Textarea, TextInput } from "@mantine/core";
import { DEPARTMENTS } from "@/config/departments";
import {
  PROJECT_STATUSES,
  validateDraft,
  type DraftErrors,
  type Project,
  type ProjectDraft,
  type ProjectStatus,
} from "./data";

const BLANK: ProjectDraft = { name: "", department: "", code: "", status: "Active", description: "" };

const DEPARTMENT_OPTIONS = [{ value: "", label: "Select a department" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))];

interface Props {
  existing: Project[];
  onCreate: (draft: ProjectDraft) => void;
  onCancel: () => void;
}

// The body of the New project dialog (U-24). It sits inside the Modal, which unmounts it on close, so every opening
// starts from a blank form.
export function NewProjectForm({ existing, onCreate, onCancel }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(BLANK);
  const [errors, setErrors] = useState<DraftErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLSelectElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateDraft(draft, existing);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.department) return departmentRef.current?.focus();
    if (found.code) return codeRef.current?.focus();
    onCreate(draft);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <TextInput
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="off"
          data-autofocus
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
          error={errors.name}
        />
        <NativeSelect
          ref={departmentRef}
          label="Department"
          name="department"
          data={DEPARTMENT_OPTIONS}
          value={draft.department}
          onChange={(e) => setDraft({ ...draft, department: e.currentTarget.value as ProjectDraft["department"] })}
          error={errors.department}
        />
        <TextInput
          ref={codeRef}
          label="Code"
          name="code"
          autoComplete="off"
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.currentTarget.value })}
          error={errors.code}
        />
        <NativeSelect
          label="Status"
          name="status"
          data={[...PROJECT_STATUSES]}
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.currentTarget.value as ProjectStatus })}
        />
        <Textarea
          label="Description"
          name="description"
          autosize
          minRows={2}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.currentTarget.value })}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create project</Button>
        </Group>
      </Stack>
    </form>
  );
}
