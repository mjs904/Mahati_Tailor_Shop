---
name: Next dev preview origins
description: Host allowlist detail for Next.js dev resources in the proxied Replit preview.
---

Next.js development previews need explicit allowed origins for both the Replit preview hostname and the loopback host used by the proxy; a wildcard Replit domain alone may not allow HMR.

**Why:** The app rendered successfully while HMR requests were blocked until the exact preview and loopback origins were allowed.

**How to apply:** When a Next.js preview shows HMR cross-origin warnings or WebSocket 502s, inspect the logged hostnames and add the exact development origins in next.config.mjs before restarting the workflow.