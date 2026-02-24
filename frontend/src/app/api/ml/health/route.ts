import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.MHCHAT_ML_API_BASE || "http://127.0.0.1:8001";
  const url = `${baseUrl.replace(/\/$/, "")}/docs`;

  try {
    const resp = await fetch(url, { cache: "no-store" });
    return NextResponse.json({ ok: resp.ok, status: resp.status });
  } catch {
    return NextResponse.json({ ok: false, status: 0 });
  }
}
