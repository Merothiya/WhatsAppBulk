# WhatsApp Bulk Marketing Tool

A production-ready WhatsApp Bulk Sender built with Next.js 14 App Router, tailored for Vercel Hobby serverless constraints.

## Tech Stack
- Next.js 14 (App Router)
- React, Tailwind CSS
- Prisma (PostgreSQL)
- Zod

## Features
- Webhook Receiver for Meta (WhatsApp Cloud API)
- Client-Side Resilient Batch Runner (Sends thousands of messages bypassing Vercel's 10s Serverless timeout)
- Sync Templates directly from Meta
- View Inbox & Delivery statuses for Campaigns

## Local Development
1. Clone the project and run `npm install`
2. Connect a Postgres Database. **Need a free one?** We recommend [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com). Create an account, spin up a Postgres DB, and copy the `DATABASE_URL`.
3. Open `.env.example`, copy it to `.env`, and fill in the values:
   - `DATABASE_URL`: Your free Postgres connection string.
   - `ADMIN_PASSWORD`: A secure password to access the dashboard.
   - `META_*`: All the credentials from your WhatsApp App in Meta Developer Portal.
4. Run `npx prisma db push` to initialize your database tables.
5. Run `npm run dev`

## Deploy to Vercel
1. Push your code to GitHub.
2. Import the repo in Vercel.
3. In the Vercel dashboard, before clicking Deploy, go to **Environment Variables** and paste all your `.env` keys.
4. Let Vercel deploy. The `postinstall` script `prisma generate` will create the Prisma Client.
5. Setup the webhook in Meta:
   - URL: `https://<YOUR_VERCEL_DOMAIN>/api/webhooks/whatsapp`
   - Verify Token: The same `META_VERIFY_TOKEN` you put in Vercel.
   - Subscribe to: `messages` and `message_template_status_update`.

## Testing Checklist
- [ ] Try logging into the Dashboard using your `ADMIN_PASSWORD`.
- [ ] Verify Webhook from Meta Developer Portal.
- [ ] Message your test number from a normal WhatsApp account; check the "Inbox" in the dashboard.
- [ ] Go to "Templates" and click "Sync from Meta" to populate from Meta.
- [ ] Go to "Campaigns", mock a campaign (using DB seed or UI if extended), and trigger the "Resume Batch Sending" button to see the client-side resilient loop process batches of 20 without timing out!
