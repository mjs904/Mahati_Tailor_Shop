# Mahathi Tailor Shop

A shopping-first Indian women's fashion marketplace with boutique tailoring and made-to-measure services.

## Run & Operate

- `pnpm --filter @workspace/mahathi-tailor-shop run dev` — run the web app
- `pnpm --filter @workspace/mahathi-tailor-shop run typecheck` — typecheck the web app
- `pnpm --filter @workspace/mahathi-tailor-shop run build` — create the static production build

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: Next.js App Router with TypeScript
- Styling: Tailwind CSS v4 through PostCSS
- Output: static export for the artifact's web preview and future publishing

## Where things live

- `artifacts/mahathi-tailor-shop/app/` — App Router pages, reusable marketplace components, local catalog data, layout, and global styles
- `artifacts/mahathi-tailor-shop/public/` — static brand artwork and public metadata
- `artifacts/mahathi-tailor-shop/next.config.mjs` — Next.js output settings

## Architecture decisions

- Keep the initial catalog and shopping interactions client-side and static so backend choices can be made later without blocking the marketplace UX.
- Use the App Router and a small dependency surface to keep the first iteration easy to maintain.
- Use marketplace conventions for search, filters, product cards, wishlist, cart feedback, and responsive navigation while keeping Mahathi's palette and tailoring identity original.
- Use the official `@insforge/sdk` for the secured InsForge connection. The reusable client/auth/table layer lives in `artifacts/mahathi-tailor-shop/lib/insforge.ts`; feature-level queries remain deferred until needed.

## Product

The current app provides a responsive marketplace homepage and Shop page with a static catalog, search, category and product filters, sorting, local wishlist/cart feedback, tailoring service discovery, bridal and Aari work highlights, and appointment CTAs. InsForge connectivity powers customer registration with embedded email-code verification, login, logout, session detection, and profile creation, while feature queries, server persistence flows, payments, and admin features remain deferred.

## User preferences

- Keep the project simple and maintainable.
- Do not add feature-level database CRUD, Razorpay, an admin dashboard, Firebase, or Supabase until explicitly requested. Use InsForge for authentication and the requested backend connection.

## Gotchas

- The artifact workflow supplies `PORT`; do not hardcode a development port in the app.
- Keep the artifact's root preview path at `/` so the web app is visible from the main preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
