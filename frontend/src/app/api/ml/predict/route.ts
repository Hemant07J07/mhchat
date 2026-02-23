import { NextResponse } from "next/server";

type MlPredictRequest = {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

type MlPredictResponse = {
  intent: string;
  intent_score: number;
  crisis: boolean;
  kb_hits: string[];
};

function buildReply(result: MlPredictResponse): string {
  if (result.crisis) {
    return (
      "I’m really sorry you’re going through this. Your safety matters most. " +
      "If you’re in immediate danger, please call your local emergency number right now. " +
      "If you can, reach out to someone you trust and stay with them. " +
      "Would you like help finding local crisis resources or connecting to a human?"
    );
  }

  const hits = Array.isArray(result.kb_hits) ? result.kb_hits.filter(Boolean) : [];

  if (hits.length === 0) {
    return "Thanks for sharing that. Can you tell me a little more about what’s been going on?";
  }

  // Keep it short: lead with the top hit, then ask one question.
  const top = hits[0];
  return `${top}\n\nWould you like to try that now, or share more about what you’re feeling?`;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  let body: MlPredictRequest;
  try {
    body = (await req.json()) as MlPredictRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", request_id: requestId },
      { status: 400 }
    );
  }

  const message = (body?.message ?? "").toString();
  if (!message.trim()) {
    return NextResponse.json(
      { error: "'message' is required", request_id: requestId },
      { status: 400 }
    );
  }

  const baseUrl = process.env.MHCHAT_ML_API_BASE || "http://localhost:8001";
  const url = `${baseUrl.replace(/\/$/, "")}/predict`;

  // Minimal server-side logging (no full message text)
  console.log(`[ml-proxy] request_id=${requestId} bytes=${message.length}`);

  const controller = new AbortController();
  const timeoutMs = Number(process.env.MHCHAT_ML_TIMEOUT_MS || 8000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
      // Never cache ML responses
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "ML service error",
          status: upstream.status,
          upstream: text.slice(0, 500),
          request_id: requestId,
        },
        { status: 502 }
      );
    }

    const result = (await upstream.json()) as MlPredictResponse;
    const reply = buildReply(result);

    return NextResponse.json({
      request_id: requestId,
      reply,
      intent: result.intent,
      intent_score: result.intent_score,
      crisis: result.crisis,
      kb_hits: result.kb_hits,
    });
  } catch (err: any) {
    const isAbort = err?.name === "AbortError";
    return NextResponse.json(
      {
        error: isAbort ? "ML service timeout" : "Failed to reach ML service",
        request_id: requestId,
      },
      { status: 504 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
