---
allowed-tools: Bash(pnpm dev*), Bash(pnpm install*), Bash(cd*), Bash(open*), Bash(sleep*), Bash(curl*)
argument-hint: (no arguments)
description: Start Remotion + the Video OS dashboard, then open the dashboard
---

## task

Bring up the **Video OS dashboard** for the creator. This starts BOTH servers but
**opens the dashboard** (never Remotion Studio).

## steps

1. **Start Remotion Studio in the background** (it backs the dashboard's renders;
   the creator does not need to look at it). From the project root:
   ```bash
   pnpm dev
   ```
   Run it as a background process — do not block on it.

2. **Start the dashboard in the background**, from `dashboard/`:
   ```bash
   cd dashboard && pnpm dev
   ```
   Also background. (If deps aren't installed yet, run `pnpm install` at the
   project root first — it's a workspace and installs both.)

3. **Wait** a few seconds until the dashboard responds (poll
   `curl -s http://localhost:4030` until it returns), then **open the dashboard**:
   ```bash
   open http://localhost:4030
   ```

4. **Report**: the dashboard is at **http://localhost:4030** (the one to use) and
   Remotion Studio is running in the background at http://localhost:3000.

## rules

- "open the dashboard" ALWAYS means the dashboard at **:4030** — never open or
  focus Remotion Studio (:3000) instead.
- Start both, but the thing you `open` for the creator is the dashboard.
- Keep both servers running in the background; don't block the session on them.
