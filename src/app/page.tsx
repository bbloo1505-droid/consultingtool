import { AppShell } from "@/components/shell/AppShell";
import { MapScreen } from "@/components/map/MapScreen";

export default function Home() {
  return (
    <AppShell title="QLD Environmental Screening">
      <MapScreen />
    </AppShell>
  );
}
