export type BrainRole = "user" | "assistant";

export type BrainMessage = {
  role: BrainRole;
  content: string;
};

export type BrainPredictResult = {
  request_id: string;
  reply: string;
  intent: string;
  intent_score: number;
  crisis: boolean;
  kb_hits: string[];
};

export async function predictWithBrain(input: {
  message: string;
  history?: BrainMessage[];
}): Promise<BrainPredictResult> {
  const resp = await fetch("/api/ml/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message,
      history: input.history,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg =
      typeof data?.error === "string" && data.error
        ? data.error
        : `Request failed (${resp.status})`;
    throw new Error(msg);
  }
  return data as BrainPredictResult;
}
