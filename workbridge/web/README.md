# WorkBridge Dashboard

Liquid-glass React client for the WorkBridge Jira + Slack APIs.

## Run

```bash
cd workbridge/web
npm install
npm run dev
```

Or from `workbridge/`:

```bash
npm run web:dev
```

Open http://localhost:5173

## Config

`.env`:

```env
VITE_API_BASE_URL=https://jpoe7wlfq7.execute-api.eu-west-2.amazonaws.com
```

In **Settings**, set Jira email / API token / base URL (stored in localStorage). Leave blank to use Lambda env fallback.
