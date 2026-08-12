# WorkBridge Admin (Kero-style)

Bootstrap 5 + jQuery admin console inspired by Kero-style layouts (sidebar, header, cards, widgets) — not the licensed Kero package.

## Run

```bash
cd workbridge/dashboard
npx --yes serve -l 5174
```

Open http://localhost:5174

Or from `workbridge/`:

```bash
npm run dashboard
```

## Features

- Standup widgets + Slack post
- Projects grid
- Issues table
- Settings for dynamic Jira headers (`localStorage`)

API base is set in `assets/js/config.js`.
