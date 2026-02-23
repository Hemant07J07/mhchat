# AI Responses Troubleshooting (mhchat-ml)

This project no longer uses legacy LLM providers or Celery for bot responses.

All “brain” functionality comes from the **mhchat-ml** FastAPI service (`POST /predict`), and the UI/server build a short, safe reply from its output:

- If `crisis=true`: return an emergency-safe message.
- Otherwise: use the top KB hit(s) as a short suggestion + a follow-up question.

## Symptoms

- The chat responds with generic fallback messages
- The chat shows no “KB hits”
- The UI shows an error like “Failed to reach ML service”

## Quick Checklist

### 1) Is mhchat-ml running?

From the `mhchat-ml` folder:

```powershell
python -m uvicorn src.api.main:app --reload --port 8001
```

Open docs: http://127.0.0.1:8001/docs

### 2) Can you hit `/predict` directly?

```powershell
$body = @{ message = 'hello' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8001/predict' -ContentType 'application/json' -Body $body
```

Expected shape:

```json
{ "intent": "...", "intent_score": 0.9, "crisis": false, "kb_hits": ["..."] }
```

### 3) Is the Next.js proxy configured?

The Next.js proxy routes call mhchat-ml using `MHCHAT_ML_API_BASE` (default: `http://localhost:8001`).

If your ML server isn’t on that address, set:

```env
MHCHAT_ML_API_BASE=http://127.0.0.1:8001
```

Then test the proxy:

- `GET /api/ml/health`
- `POST /api/ml/predict` with body `{ "message": "hello" }`

### 4) Django pipeline (optional)

If you’re using the Django message endpoints, the bot reply pipeline is synchronous and calls mhchat-ml via `chat/ml_brain_client.py`.

Run:

```powershell
python run_complete_tests.py
```

If mhchat-ml is not running, the pipeline will fall back to the local generator (this is expected).

## Common Fixes

- **mhchat-ml not started** → start it on port `8001`.
- **Wrong ML base URL** → set `MHCHAT_ML_API_BASE`.
- **Timeouts** → increase `MHCHAT_ML_TIMEOUT_MS` in the frontend environment.

## Notes

- There is no Celery worker to run.
- Redis is not required unless you explicitly configure Channels to use Redis (`CHANNEL_LAYER_BACKEND=redis`).
