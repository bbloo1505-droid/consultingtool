import { NextRequest, NextResponse } from "next/server";
import { resolveQueenslandAddressToParcel } from "@/lib/qld-address-parcel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { address?: unknown };
    const address = typeof body.address === "string" ? body.address : "";
    const result = await resolveQueenslandAddressToParcel(address);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed.";
    const status = message.includes("No matching") || message.includes("No Queensland") ? 404 : 400;
    return NextResponse.json({ error: message }, { status: message.includes("Try again later") ? 502 : status });
  }
}
