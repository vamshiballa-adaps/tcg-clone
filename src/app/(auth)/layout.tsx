import { Container } from "@mantine/core";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Container size="xs" py={80}>
      {children}
    </Container>
  );
}
