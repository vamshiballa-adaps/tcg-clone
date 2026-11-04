"use client";

import { useRef, useState } from "react";
import { Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { parseAmount, type Verb } from "./data";

interface Props {
  mode: Verb;
  onSubmit: (amount: number, reason: string) => void;
  onCancel: () => void;
}

// The body of the Add tokens dialog (an admin tops up the allowance) and of the Request tokens dialog (a user asks
// their admin, with a reason). It sits inside the Modal, which unmounts it on close, so every opening starts blank.
export function TokenForm({ mode, onSubmit, onCancel }: Props) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [amountError, setAmountError] = useState<string>();
  const [reasonError, setReasonError] = useState<string>();
  const amountRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseAmount(amount, mode);
    const missingReason = mode === "request" && !reason.trim() ? "Tell your admin why you need them." : undefined;
    setAmountError("error" in parsed ? parsed.error : undefined);
    setReasonError(missingReason);
    if ("error" in parsed) return amountRef.current?.focus();
    if (missingReason) return reasonRef.current?.focus();
    onSubmit(parsed.amount, reason.trim());
  }

  return (
    <form onSubmit={submit} noValidate>
      <Stack>
        <TextInput
          ref={amountRef}
          label="Amount"
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          data-autofocus
          value={amount}
          onChange={(e) => setAmount(e.currentTarget.value)}
          error={amountError}
        />
        {mode === "request" && (
          <Textarea
            ref={reasonRef}
            label="Reason"
            name="reason"
            autosize
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
            error={reasonError}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{mode === "add" ? "Confirm top-up" : "Send request"}</Button>
        </Group>
      </Stack>
    </form>
  );
}
