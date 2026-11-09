"use client";

import { useRef, useState } from "react";
import { Button, Group, NativeSelect, Stack, TextInput } from "@mantine/core";
import {
  INPUT_TYPES,
  PROJECT_NAMES,
  sourceHint,
  validateInput,
  type InputDraft,
  type InputErrors,
  type InputType,
  type RegistryInput,
} from "./data";

const BLANK: InputDraft = { name: "", type: "", project: "", source: "" };

const TYPE_OPTIONS = [{ value: "", label: "Select a type" }, ...INPUT_TYPES.map((t) => ({ value: t, label: t }))];
const PROJECT_OPTIONS = [{ value: "", label: "Select a project" }, ...PROJECT_NAMES.map((p) => ({ value: p, label: p }))];

interface Props {
  existing: RegistryInput[];
  onAdd: (draft: InputDraft) => void;
  onCancel: () => void;
}

// The body of the Add input dialog (U-25). It sits inside the Modal, which unmounts it on close, so every opening starts
// from a blank form. The rule for Source depends on the chosen type.
export function AddInputForm({ existing, onAdd, onCancel }: Props) {
  const [draft, setDraft] = useState<InputDraft>(BLANK);
  const [errors, setErrors] = useState<InputErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const projectRef = useRef<HTMLSelectElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateInput(draft, existing);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.type) return typeRef.current?.focus();
    if (found.project) return projectRef.current?.focus();
    if (found.source) return sourceRef.current?.focus();
    onAdd(draft);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack>
        <TextInput
          ref={nameRef}
          label="Input name"
          name="input-name"
          autoComplete="off"
          data-autofocus
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
          error={errors.name}
        />
        <NativeSelect
          ref={typeRef}
          label="Input type"
          name="input-type"
          data={TYPE_OPTIONS}
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.currentTarget.value as InputType | "" })}
          error={errors.type}
        />
        <NativeSelect
          ref={projectRef}
          label="Project"
          name="project"
          data={PROJECT_OPTIONS}
          value={draft.project}
          onChange={(e) => setDraft({ ...draft, project: e.currentTarget.value })}
          error={errors.project}
        />
        <TextInput
          ref={sourceRef}
          label="Source"
          name="source"
          autoComplete="off"
          description={sourceHint(draft.type)}
          value={draft.source}
          onChange={(e) => setDraft({ ...draft, source: e.currentTarget.value })}
          error={errors.source}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save input</Button>
        </Group>
      </Stack>
    </form>
  );
}
