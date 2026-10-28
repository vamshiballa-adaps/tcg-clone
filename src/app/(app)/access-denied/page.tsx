import type { Metadata } from "next";
import Link from "next/link";
import { Stack, Text, Title } from "@mantine/core";

export const metadata: Metadata = { title: "Access denied" };

// The proxy rewrites to this page when a signed-in role cannot open the page that was asked for, so the address bar
// still shows the page they tried. The status is 200 (see proxy.ts).
export default function Page() {
  return (
    <Stack gap="sm">
      <Title order={2}>Access denied</Title>
      <Text>Your role can&apos;t open this page. Ask a workspace admin if you need access.</Text>
      <Link href="/" style={{ color: "var(--mantine-color-anchor)" }}>
        Back to Dashboard
      </Link>
    </Stack>
  );
}
