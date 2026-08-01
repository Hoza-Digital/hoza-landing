# Hoza — Fast Forward

A production-ready, motion-led landing page for Hoza, built with Next.js, TypeScript, Tailwind CSS, GSAP, and Lenis.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production check

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase backend

The enquiry form and admin dashboard use Supabase Postgres through server-only RPC calls. Apply `supabase/migrations/20260801061500_hoza_backend.sql`, then copy `.env.example` to `.env.local` and configure:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace-me
SUPABASE_BACKEND_SECRET=replace-with-a-long-random-server-secret
ADMIN_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Keep `.env.local` private. To add or rotate an administrator, provide `ADMIN_EMAIL_INPUT` and `ADMIN_PASSWORD_INPUT`, then run `npm run admin:upsert`.

The form posts to `app/api/enquiry/route.ts`. Set `CRM_WEBHOOK_URL` if each validated enquiry should also be forwarded to an external CRM.

## Brand/contact configuration

Update `.env.local` from `.env.example`, then replace the placeholder WhatsApp number, email, and canonical domain as needed.
