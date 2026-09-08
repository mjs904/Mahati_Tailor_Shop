---
name: Next.js artifact foundation
description: Notes for using a Next.js App Router inside the web artifact scaffold.
---

When converting the web artifact scaffold to Next.js, remove the generated `src/pages` directory entirely before building; even an empty pages directory makes Next reject an app-directory at the project root.

**Why:** The scaffold is Vite-oriented and can leave an empty pages directory behind, which triggers a confusing Next build error about app and pages directories needing the same parent.

**How to apply:** For future Next.js conversions, use a root `app/` directory, keep the artifact’s managed workflow, and point static production output at the configured Next `distDir`.