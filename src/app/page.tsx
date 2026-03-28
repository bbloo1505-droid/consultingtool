import { HomeTabs } from "@/components/HomeTabs";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="QLD environmental screening"
        subtitle="Screen Queensland map layers, export reports, and study Term 1 graduate topics in the Learn tab."
      />
      <HomeTabs />
    </div>
  );
}
