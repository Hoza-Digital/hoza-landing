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

## Enquiry integration

The form posts to `app/api/enquiry/route.ts`. It validates input and is ready for a CRM/webhook integration. Add `CRM_WEBHOOK_URL` and replace the marked integration block with your provider-specific payload/signature handling.

## Brand/contact configuration

Update `.env.local` from `.env.example`, then replace the placeholder WhatsApp number, email, and canonical domain as needed.
