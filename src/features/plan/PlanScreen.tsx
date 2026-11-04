"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Group, Modal, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSession } from "@/components/auth/useSession";
import { getDevRole } from "@/lib/role";
import { TokenForm } from "./TokenForm";
import { formatTokens, ORG_NAME, PLAN_NAME, SEED_ALLOWANCE, TOKENS_USED, usedPercent } from "./data";

interface Notice {
  title: string;
  text: string;
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <Text component="dt" size="sm" c="dimmed">
        {term}
      </Text>
      <Text component="dd" m={0} fw={500}>
        {children}
      </Text>
    </div>
  );
}

// My Plan (U-40, A-23): the organisation, the plan and the token meter. An admin tops up the allowance (the meter
// moves); a user asks their admin for tokens (nothing moves). Other plan content is still to build. The balance lives
// in this component only, so a full reload goes back to the seeded numbers.
export function PlanScreen() {
  const session = useSession();
  const [allowance, setAllowance] = useState(SEED_ALLOWANCE);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialogOpen, { open: openDialog, close: closeDialog }] = useDisclosure(false);

  // Next keeps a page it navigated away from, hidden, with its state, and shows that copy again on the way back. Its
  // effects are cleaned up when it is hidden, so drop the confirmation then: it is about last visit. The balance is
  // kept, like the list on the Projects screen.
  useEffect(() => () => setNotice(null), []);

  // Wait for the session: the stand-in role is admin, so a user would otherwise see the admin's button for a moment.
  const role = session === undefined ? undefined : (session?.role ?? getDevRole());
  const isAdmin = role === "admin";
  const remaining = allowance - TOKENS_USED;
  const percent = usedPercent(allowance);

  function onSubmit(amount: number) {
    if (isAdmin) {
      const next = allowance + amount;
      setAllowance(next);
      setNotice({
        title: "Top-up applied",
        text: `Added ${formatTokens(amount)} tokens. You now have ${formatTokens(next - TOKENS_USED)} tokens remaining.`,
      });
    } else {
      setNotice({ title: "Request sent", text: `Your request for ${formatTokens(amount)} tokens was sent to your admin.` });
    }
    closeDialog();
  }

  return (
    <Stack gap="md" maw={640}>
      <Title order={2}>My Plan</Title>
      <Text c="dimmed">Your organisation&apos;s plan and token balance.</Text>

      {notice && (
        <Alert color="green" title={notice.title} role="status" withCloseButton closeButtonLabel="Dismiss" onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Title order={3}>Plan details</Title>
          <Box component="dl" m={0}>
            <Group gap="xl">
              <Fact term="Organisation">{ORG_NAME}</Fact>
              <Fact term="Plan">{PLAN_NAME}</Fact>
            </Group>
          </Box>
          <Text size="sm" c="dimmed">
            Other plan details are not available yet.
          </Text>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start">
            <Title order={3}>Token meter</Title>
            {isAdmin && <Button onClick={openDialog}>Add tokens</Button>}
            {role === "user" && <Button onClick={openDialog}>Request tokens</Button>}
          </Group>
          <Progress value={percent} size="lg" aria-label="Share of tokens consumed" />
          <Text size="sm">{percent}% used</Text>
          <Box component="dl" m={0}>
            <Group gap="xl">
              <Fact term="Token allowance">{formatTokens(allowance)}</Fact>
              <Fact term="Tokens used">{formatTokens(TOKENS_USED)}</Fact>
              <Fact term="Tokens remaining">{formatTokens(remaining)}</Fact>
            </Group>
          </Box>
        </Stack>
      </Paper>

      <Modal opened={dialogOpen} onClose={closeDialog} title={isAdmin ? "Add tokens" : "Request tokens"}>
        <TokenForm mode={isAdmin ? "add" : "request"} onSubmit={onSubmit} onCancel={closeDialog} />
      </Modal>
    </Stack>
  );
}
