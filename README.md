# 📱 WhatsApp Bulk Campaign Manager

A powerful, production-ready WhatsApp Bulk Sender built with **Next.js 14**, designed to help you manage large-scale marketing campaigns without hitting serverless timeout limits.

---

## 🚀 Key Features

- **Blazing Fast Contact Management**: Supports 3,000+ contacts with server-side pagination and infinite scroll.
- **Smart Campaign Creator**: Real-time template previews, support for named variables (e.g., `{{name}}`), and header media.
- **Robust Sending Engine**: Processes massive batches (20 messages/chunk) bypasses Vercel's 10s timeout using a client-side resilient loop.
- **Live Inbox**: Real-time two-way messaging with direct reply capabilities and search functionality.
- **Global Blocking**: Permanent block-list that automatically filters unwanted numbers during future imports.
- **Meta Sync**: Automatic synchronization of your approved WhatsApp Business templates.

---

## 🛠 Prerequisites

Before starting, ensure you have:
1. **Node.js 18+** installed.
2. A **PostgreSQL** database (We recommend [Neon.tech](https://neon.tech/) for a free/easy setup).
3. A **Meta Developer Account** with a WhatsApp Business App set up.

---

## 🏁 Getting Started (Step-by-Step)

### 1. Clone & Install
```bash
git clone https://github.com/Merothiya/WhatsAppBulk.git
cd WhatsAppBulk
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root directory (you can copy `.env.example`) and fill in the following:

```env
# Database (PostgreSQL)
DATABASE_URL="your_postgresql_connection_string"

# Dashboard Security
ADMIN_PASSWORD="choose_a_secure_password"
APP_BASE_URL="http://localhost:3000"

# Meta Cloud API Credentials
META_PHONE_NUMBER_ID="your_phone_number_id"
META_WABA_ID="your_whatsapp_business_account_id"
META_SYSTEM_USER_TOKEN="your_permanent_access_token"
META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
META_VERIFY_TOKEN="choose_any_random_string_for_webhook"

# Media Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
```

### 3. Initialize the Database
This command creates all necessary tables and indexes in your PostgreSQL database.
```bash
npx prisma db push
```

### 4. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000` to see your dashboard!

---

## ☁️ Deployment (Vercel)

1. Connect your repository to **Vercel**.
2. Add all the environment variables from your `.env` file to the Vercel Project Settings.
3. Once deployed, set up your **Webhook** in the Meta Developer Portal:
   - **Callback URL**: `https://your-domain.vercel.app/api/webhooks/whatsapp`
   - **Verify Token**: The same string you used for `META_VERIFY_TOKEN`.
   - **Fields to subscribe**: `messages`, `message_template_status_update`.

---

## 📖 Pro Tips for Beginners

- **Templates**: Go to the **Templates** tab and click **Sync from Meta** first to fetch your pre-approved WhatsApp templates.
- **Contact Search**: Use the search bar in the "New Campaign" modal to find specific groups and use the "Select All Matching" feature.
- **Blocking**: Block spammy users directly from the Inbox header; they will be automatically removed from the database and prevented from being re-imported.
- **Variables**: Use `{{name}}` or other custom placeholders in your templates; the app will automatically prompt you for values during campaign creation.

---

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you want to improve the app!
