# KadaiVoice AI 🎙️🛒
## AI-Powered Voice-First Business Management Platform for Local Stores
> *"Run Your Shop. Just Speak."*
> *"உங்கள் கடையை நிர்வகியுங்கள். பேசி மட்டுமே."*

KadaiVoice AI is a complete, production-grade SaaS web application built for local Kirana stores, grocery shops, provision stores, and retail businesses in India. It empowers shop owners to manage daily sales, track inventory stock, maintain digital customer credit (khata) ledgers, and review end-of-day business reports using natural voice commands in **Tamil, Tanglish, and English**.

---

## 🚀 LIVE ACCESS
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **Backend Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Demo Store:** **Immanuel Mini Mart** (20 products, 10 customers, 22 sales transactions)
- **Demo Login:** `demo@kadaivoice.ai` / `admin123` *(or click **"1-Click Demo Login"** on the sign-in page)*

---

## 🌟 Core Features & New Advanced Additions

### 1. 🔊 Dedicated "Counter Soundbox Mode" (Like Paytm/PhonePe Box)
- **Location:** `/soundbox`
- Full-screen high-contrast dark LED interface built for mounting on an inexpensive tablet or smartphone at the cash counter.
- **Dual-tone Melodic Chime:** Synthesizes an authentic payment soundbox chime using the Web Audio API.
- **Voice Announcements in Tamil & English:**
  - *"கடைவாய்ஸ்: ₹350 ரொக்க விற்பனை வெற்றிகரமாக முடிந்தது."* *(KadaiVoice: ₹350 Cash sale recorded).*
  - *"KadaiVoice: Rupees 620 UPI sale recorded successfully."*
- **Hands-Free Continuous Wake-Word Listening:** Continuously listens for commands (*"Hey Kadai"*, *"Sold 2 kg rice"*).

### 2. 📲 WhatsApp Khata Reminders & UPI Deep-Links
- **Location:** Credit Management (`/credit`) & Voice Assistant
- Automatically crafts personalized Tamil/English messages with instant **UPI Deep-Links**:
  `upi://pay?pa=shop@upi&pn=ImmanuelMiniMart&am=1500&cu=INR`
- Customers tap the link directly inside WhatsApp to pay via **GPay, PhonePe, or Paytm**!
- 1-click **"Send WhatsApp"** button launches WhatsApp Web or mobile app directly.

### 3. 📦 One-Click Voice Supplier Reordering (Wholesale Purchase Indent)
- **Location:** Inventory (`/inventory`) & Voice Assistant
- Aggregates all low stock items automatically and groups them by wholesale distributor.
- Generates formatted purchase indent text ready to forward via WhatsApp:
  ```text
  Wholesale Purchase Order - Immanuel Mini Mart:
  1. Ponni Boiled Rice - 50 kg
  2. Gold Winner Sunflower Oil - 20 Ltr
  3. Farm Fresh Eggs - 30 pcs
  Please dispatch by tomorrow 10:00 AM.
  ```

### 4. 📷 Hybrid Voice + Camera Barcode Scanner
- **Location:** Sales Billing Counter (`/sales`)
- Combines device camera optical barcode scanning with real-time speech quantity recognition.
- Point camera at barcode + speak: *"3 packets"* ➔ plays POS laser beep and instantly adds the item to the billing cart!

### 5. 📊 Voice-Driven GST & Tally XML Export
- **Location:** Daily Reports (`/reports`)
- **Tally ERP9 / Tally Prime XML Export:** 1-click export of sales vouchers formatted for direct import into Tally.
- **GSTR-1 JSON Tax Slabs Bifurcation:** Automatically maps items to official Indian tax categories:
  - **0% (Nil-Rated):** Food grains, rice, dal, fresh milk, farm eggs.
  - **5%:** Edible cooking oils, sugar, tea, coffee, spices.
  - **12%:** Pure cow ghee, processed dairy.
  - **18%:** Personal care, soaps, shampoos, detergents.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite 6, Tailwind CSS, Framer Motion, Lucide React, Recharts, Axios, Web Audio API, Web Speech API.
- **Backend:** Node.js v22, Express.js, MongoDB 8, Mongoose, JWT authentication, bcryptjs, Multer.
- **AI Stack (Gnani.ai):**
  - **Gnani Prisma:** Indic Speech-to-Text (`https://api.vachana.ai/stt/v3`)
  - **Gnani Evon:** Indic NLU & structured JSON extraction (`evon-v3.3`)
  - **Gnani Timbre:** Low-latency Text-to-Speech synthesis (`https://api.vachana.ai/api/v1/tts/inference`)
