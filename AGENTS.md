# Repository Guidelines

## Project Structure & Module Organization

Petwo is a mobile-first Next.js app using the App Router. Route pages live in `app/` (`app/auth/page.tsx`, `app/dashboard/page.tsx`, etc.), with shared layout and global styles in `app/layout.tsx` and `app/globals.css`. Reusable UI and state wrappers live in `components/`. Domain logic, Supabase access, visual helpers, shop data, and shared TypeScript types live in `lib/`. Static assets are in `public/`, database setup is in `supabase/schema.sql`, and design references are under `stitch_petwo_shared_virtual_pet/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `cp .env.example .env.local`: create local configuration for Supabase.
- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and catch Next.js build errors.
- `npm run start`: run the production build locally after `npm run build`.
- `npm run typecheck`: run `tsc --noEmit` with strict TypeScript settings.

There is currently no `npm test` or lint script. Use `npm run typecheck` and `npm run build` as minimum PR verification.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Keep route filenames aligned with Next.js conventions: `page.tsx`, `layout.tsx`, and route folders under `app/`. Name components and exported types in PascalCase, helper functions in camelCase, and database-shaped fields in snake_case when matching Supabase rows. Use the configured `@/*` path alias for readable root imports.

Styling is Tailwind-first, with theme classes in `app/globals.css` and `tailwind.config.ts`. Follow the existing two-space indentation, double quotes, semicolons, and compact JSX style.

## Testing Guidelines

No automated test framework is configured yet. For new business logic in `lib/`, prefer small pure functions that can be covered when a runner is added. For UI changes, manually verify relevant mobile routes through `npm run dev`, especially auth, onboarding, dashboard, pet, journal, games, shop, and settings. Always run `npm run typecheck` before submitting.

## Commit & Pull Request Guidelines

The current Git history uses short, imperative commit summaries, for example `Initial Petwo MVP`. Keep commits focused and describe the user-visible change or technical fix. Pull requests should include a concise summary, verification steps, linked issues when applicable, and screenshots or screen recordings for UI changes.

## Security & Configuration Tips

Do not commit `.env`, `.env.local`, Supabase keys, or build output. Keep `.env.example` updated when adding variables. Reflect database changes in `supabase/schema.sql` and call them out in the PR.
