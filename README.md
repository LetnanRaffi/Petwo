# Petwo

Mobile-first Petwo MVP prototype using Next.js and Supabase.

## Setup Checklist

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Enable Google Auth in Supabase Authentication providers.
4. Fill `.env.local` from `.env.example`.
5. Restart the dev server.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Petwo requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either value is missing, the app shows a setup error screen and does not load mocked data.
