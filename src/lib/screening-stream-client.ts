import type { LayerScreeningResult, ScreenResponse } from "@/types/screening";

type StreamMsg =
  | { type: "start"; totalLayers: number; generatedAt: string }
  | { type: "layer"; index: number; layer: LayerScreeningResult }
  | { type: "complete"; screen: ScreenResponse }
  | { type: "error"; message: string };

/**
 * POSTs to `/api/screen/stream` and parses NDJSON. Invokes `onLayer` for each layer; returns final `ScreenResponse`.
 */
export async function fetchScreeningNdjsonStream(
  body: { aoi: unknown; lga: string },
  opts: {
    onStart?: (totalLayers: number) => void;
    onLayer?: (layer: LayerScreeningResult, index: number, totalLayers: number) => void;
  },
): Promise<ScreenResponse> {
  const res = await fetch("/api/screen/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body.");

  const decoder = new TextDecoder();
  let buf = "";
  let totalLayers = 0;
  let complete: ScreenResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      const msg = JSON.parse(t) as StreamMsg;
      if (msg.type === "start") {
        totalLayers = msg.totalLayers;
        opts.onStart?.(msg.totalLayers);
      } else if (msg.type === "layer") {
        opts.onLayer?.(msg.layer, msg.index, totalLayers);
      } else if (msg.type === "complete") {
        complete = msg.screen;
      } else if (msg.type === "error") {
        throw new Error(msg.message);
      }
    }
  }
  if (!complete) {
    throw new Error("Stream ended before complete payload.");
  }
  return complete;
}
