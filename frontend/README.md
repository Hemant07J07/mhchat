This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ML “brain” integration (mhchat-ml)

This frontend calls a Next.js server-side proxy route which forwards to the FastAPI ML service.

### 1) Start the ML API

From the folder that contains both `mhchat/` and `mhchat-ml/`:

```bash
cd mhchat-ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8001 --reload
```

If you're currently in `mhchat/frontend`, you can also do:

```bash
cd ..\\..\\mhchat-ml
```

### 2) Configure the frontend

Create `frontend/.env.local`:

```bash
MHCHAT_ML_API_BASE=http://localhost:8001
MHCHAT_ML_TIMEOUT_MS=8000
NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL=support@example.com
```

### 3) Start Next.js

```bash
npm install
npm run dev
```

### 4) Smoke-test the proxy route

In another terminal:

```bash
npm run test:ml-proxy -- "I feel overwhelmed"
```

Or with curl:

```bash
curl -X POST http://localhost:3000/api/ml/predict -H "Content-Type: application/json" -d "{\"message\":\"I feel overwhelmed\"}"
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
