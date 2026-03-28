import { MapScreen } from "@/components/map/MapScreen";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="QLD environmental screening"
        subtitle="Brisbane-first prototype - MSES layers via Queensland Government ArcGIS services"
      />
      <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
        <MapScreen />
      </main>
    </div>
  );
}
