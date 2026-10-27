import { StartupScreen } from "@/components/startup/StartupScreen";

// The slot's page for "/": the Home screen's simulated cold start. It sits beside the app shell (see layout.tsx), so
// the loading screen is not nested inside the <main> it hides.
export default function Page() {
  return <StartupScreen />;
}
