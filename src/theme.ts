import { createTheme } from "@mantine/core";

// Central place for design tokens. Keep both light and dark themes working.
export const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), monospace",
});
