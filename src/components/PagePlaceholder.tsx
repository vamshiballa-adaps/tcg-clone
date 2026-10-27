import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { getRoute, type Status } from "@/config/routes";
import { PipelineRail } from "@/components/PipelineRail";

const STATUS_COLOR: Record<Status, string> = { todo: "gray", "in-progress": "yellow", done: "green" };

// Temporary screen body. Replace with the real implementation and update `status` in config/routes.ts.
export function PagePlaceholder({ route }: { route: string }) {
  const def = getRoute(route);
  return (
    <Stack gap="md">
      {def.stage && <PipelineRail active={def.stage} />}
      <Group justify="space-between" align="flex-start">
        <Title order={2}>{def.title}</Title>
        <Badge color={STATUS_COLOR[def.status]} variant="light">
          {def.status}
        </Badge>
      </Group>
      <Text c="dimmed">{def.description}</Text>
      <Paper withBorder p="md">
        <Text size="sm" fw={500} mb={4}>
          Catalogue features to build here
        </Text>
        <Group gap="xs">
          {def.features.map((id) => (
            <Badge key={id} variant="outline">
              {id}
            </Badge>
          ))}
        </Group>
        <Text size="xs" c="dimmed" mt="sm">
          Route <code>{def.path}</code> · access: {def.roles === "all" ? "User + Admin" : "Admin only"}
        </Text>
      </Paper>
    </Stack>
  );
}
