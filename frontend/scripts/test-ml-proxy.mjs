const base = process.env.NEXT_BASE_URL || "http://localhost:3000";
const message = process.argv.slice(2).join(" ") || "I feel anxious and can't sleep.";

async function main() {
  const url = new URL("/api/ml/predict", base);
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    console.error(`HTTP ${resp.status}: ${text}`);
    process.exit(1);
  }

  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
