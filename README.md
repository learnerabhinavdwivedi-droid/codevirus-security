# Codevirus Security — Enterprise AI Operations & Lead Suite
### Production Installation, Deployment & Operations Manual

Autonomous AI Voice Receptionist, Lead Qualification, CRM & Consultation Scheduling Suite for **Codevirus Security Private Limited** and **Codevirus Academy** (Kapoorthala, Aliganj, Lucknow, Uttar Pradesh, India).

Powered by **Vapi AI (Voice Orchestration)** + **Deepgram Nova-2 (Speech-to-Text)** + **Cartesia / ElevenLabs (Indian Accent Synthesis)** + **OpenAI GPT-4o (Lead Intelligence)** + **Meta WhatsApp Cloud API / Twilio WhatsApp** + **Dual-Layer Database (Supabase Cloud + Local Atomic Store)**.

---

## ⚡ Quick Launch Options

### Option 1: 1-Click Launch (Windows)
Double-click [`start.bat`](file:///c:/voice%20code%20virus/start.bat) in the root directory.

### Option 2: Unified Node Runner
```bash
node start.js
```
Automatically starts the API server on `http://localhost:3000`, establishes the public webhook tunnel, synchronizes Vapi configuration, and launches the Operations Dashboard in your default browser.

### Option 3: PM2 Enterprise Background Daemon (24/7 Production)
```bash
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 logs
```

### Option 4: Docker & Docker Compose Container
```bash
docker-compose up -d --build
```

### Option 5: Native Windows Service (Runs on Windows Boot)
```bash
node windows-service.js
```

---

## 🌐 Live System URLs

| Interface | URL | Purpose |
|---|---|---|
| **Modern React App (Single-Page App)** | [http://localhost:3000/](http://localhost:3000/) | Unified React UI with Tab Switcher, WebRTC Voice Agent, CRM & Diary |
| **Operations Dashboard** | [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html) | Live call center, candidate intake, CSV exports, `.ics` sync, and test dialer |
| **Consultation Diary** | [http://localhost:3000/BookingCalendar.html](http://localhost:3000/BookingCalendar.html) | Weekly schedule (10:00–22:00 IST) for training & enterprise VAPT sessions |
| **WhatsApp Business Console** | [http://localhost:3000/whatsapp.html](http://localhost:3000/whatsapp.html) | Live WhatsApp Business CRM console with real-time incoming message polling |
| **Export Consultations CSV** | [http://localhost:3000/api/export/consultations.csv](http://localhost:3000/api/export/consultations.csv) | Direct CSV download of all consultation records for Excel / Google Sheets |
| **Export Leads CSV** | [http://localhost:3000/api/export/leads.csv](http://localhost:3000/api/export/leads.csv) | Direct CSV download of all WhatsApp and phone leads |
| **System Health Check** | [http://localhost:3000/health](http://localhost:3000/health) | Realtime system health, Vapi assistant status, and tunnel state |

### ⚛️ Frontend Development (React + Vite)
```bash
# Build React app for production (bundles into frontend/dist)
npm run build

# Start Vite live hot-reloading dev server on port 5173
npm run dev:frontend
```

---

## ⚙️ Environment Configuration ([`.env`](file:///c:/voice%20code%20virus/.env))

```env
PORT=3000
NODE_ENV=production

# ── Vapi Voice API (vapi.ai) ──────────────────────────────────
VAPI_PRIVATE_KEY=your_vapi_private_key_here
VAPI_PUBLIC_KEY=your_vapi_public_key_here
VAPI_WEBHOOK_SECRET=your_vapi_shared_webhook_secret
ASSISTANT_ID=your_vapi_assistant_uuid
PHONE_NUMBER_ID=your_vapi_phone_number_uuid
INDIA_PHONE_NUMBER=+919648777706
TWILIO_NUMBER=+919648777706

# ── OpenAI API (platform.openai.com) ──────────────────────────
OPENAI_API_KEY=your_openai_api_key_here

# ── Supabase Realtime Database (supabase.com) ─────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE=your_supabase_service_role_secret
SUPABASE_ANON_KEY=your_supabase_anon_public_key

# ── Real Meta WhatsApp Cloud API (Optional for direct Meta API) ─
WHATSAPP_TOKEN=your_meta_whatsapp_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_custom_webhook_verify_token

# ── Real Twilio WhatsApp (Optional for direct Twilio numbers) ───
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ── Test & Counselor Mobile Number ────────────────────────────
DEMO_PHONE_NUMBER=+919648777706
ADMIN_API_KEY=your_long_random_admin_api_key
```

---

## 📱 Indian Telephony & Inbound Phone Integration

To connect real inbound calls to Sarah:
1. Open [Vapi Dashboard](https://dashboard.vapi.ai) $\rightarrow$ **Phone Numbers** $\rightarrow$ **Import SIP / BYO Number**.
2. Provision your Indian number with SIP trunking (e.g. Exotel, Knowlarity, or Ozonetel) and point the trunk to Vapi.
3. Set **Inbound Assistant** $\rightarrow$ `Sarah - Codevirus Security`.
4. Set Server URL $\rightarrow$ your production webhook URL (e.g. `https://voice.codevirussec.in/webhook`) with secret `VAPI_WEBHOOK_SECRET`.
5. Whenever a client calls the number, Sarah answers within 2 rings, handles English/Hindi/Hinglish, checks diary availability, guards against double-booking, and confirms the consultation into your dashboard.

---

## 💬 Real WhatsApp Webhook Integration

### 1. Meta WhatsApp Cloud API
1. In Meta Developer Console $\rightarrow$ WhatsApp $\rightarrow$ Configuration $\rightarrow$ **Callback URL**:
   * URL: `https://your-public-url.loca.lt/api/webhook/whatsapp`
   * Verify Token: `codevirus_secret_token_2026` (or whatever is set in `WHATSAPP_VERIFY_TOKEN`)
2. Subscribe to `messages` event.
3. Inbound messages from students are automatically stored, replied to by Sarah AI, qualified, and updated in real-time on `whatsapp.html`!

### 2. Twilio WhatsApp
1. In Twilio Console $\rightarrow$ Phone Numbers $\rightarrow$ WhatsApp Sandbox / Senders:
   * **WHEN A MESSAGE COMES IN**: `https://your-public-url.loca.lt/api/webhook/twilio-whatsapp` (HTTP POST)
2. Sarah automatically handles questions and replies back via standard TwiML XML.

---

## 📥 Calendar Synchronization (.ics) & CSV Exports

- **Google Calendar / Outlook / Apple Calendar:** Click **📅 .ics** on any consultation row in the dashboard to download an RFC 5545 calendar invite with location (`Codevirus Security, Kapoorthala, Lucknow`), counselor name, and batch track.
- **CSV Data Export:** Click **📥 Export CSV** in the toolbar or navigate to `/api/export/consultations.csv` to export all bookings with full metadata (ID, Candidate Name, Phone, Email, Track, Counselor, Batch Preference, Date, Time, Status, Notes).

---

## 🧪 Verification & Automated Test Suite

Run the full automated test suite anytime:
```bash
node test-suite.js
```
or via npm:
```bash
npm test
```
Validates:
* 100% JavaScript syntax check across 11 source files
* Static assets (`logo-navy.png`, `chat-wallpaper.png`, `wa-icon.svg`)
* REST API endpoints (`/health`, `/config`, `/api/analytics`, `/api/activity`)
* Double-booking collision protection (`HTTP 409 Conflict`)
* Patch, delete, and dormant reactivation
* CSV and iCalendar generator endpoints
* Meta WhatsApp and Twilio webhook receivers
