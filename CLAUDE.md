# Shiftup Performance — Project Memory

## Overview
เว็บไซต์ P2W Interplus — บริการ ECU Remap, HKS Exhaust, Panthera Active Sound
- **URL**: deploy บน **Vercel** (auto-deploy จาก GitHub main)
- **Domain**: `www.shiftupperformance.com` — live แล้ว (18 มิ.ย. 2569)
- **Stack**: React 18 + Vite 5 + Tailwind CSS v3 + Express server
- **วันที่อัปเดต**: 12 ก.ค. 2569 (session 8)

---

## Git Rules — สำคัญมาก ❗
- มีแค่ **`main` branch เดียว** เท่านั้น (ลบ dev ออกแล้ว)
- ทุก commit ให้ push ตรงไป `git push origin main` เลย
- **ห้าม** สร้าง branch ใหม่, ห้าม merge, ห้ามใช้ `--theirs` / `--ours`
- ถ้า pull แล้วมี conflict → แจ้ง user ก่อน อย่าแก้เอง
- Admin panel บันทึกเนื้อหาผ่าน `/api/save-content` → commit ตรงไป GitHub main อัตโนมัติ
- cron-job.org sync visits/bookings ทุก 30 นาที → ถ้า push conflict ให้ `git pull --rebase origin main` ก่อน

---

## URLs ที่สำคัญ

### Apps Script — deployment "ไม่มีชื่อ" (อัปเดต 6 มิ.ย. 2569)
| ใช้ที่ไหน | URL (deployment ID) |
|---|---|
| **server.js** `SHEET_DOGET_URL` (dashboard GET + visit tracking POST) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |
| **App.jsx** `GOOGLE_SCRIPT_URL` (remap/partner forms POST) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |

> ✅ ใช้ deployment เดียว ทุกอย่าง — "ไม่มีชื่อ" deployment version 17+
> ⚠️ **อย่าสร้าง deployment ใหม่** — URL จะเปลี่ยน ให้ใช้ Manage deployments → Edit → New version เท่านั้น

### Google Sheet
`https://docs.google.com/spreadsheets/d/1Su-nW33_bmmE-RUDy0xVf7ppiee4g9RuuA5HcIgyN6E`

### LINE OA
`https://lin.ee/nZOMcph`

---

## รหัสผ่าน Admin
- **Admin Panel** (Remap/HKS/Panthera edit): `Chev9872`
- **Dashboard** (หลังบ้าน): `Chev9872` — ปุ่ม ⚙ มุมล่างขวา หน้าแรกเท่านั้น
- **Notification email**: `p2w.interplus@gmail.com`

---

## Vercel Environment Variables (สำคัญ — ต้องตั้งทุกตัว)
| ชื่อตัวแปร | ใช้ทำอะไร |
|---|---|
| `RESEND_API_KEY` | Email notification ผ่าน Resend API |
| `GITHUB_TOKEN` | บันทึก visits.json + content.json + bookings.json ไป GitHub |
| `GITHUB_OWNER` | `p2winterplus-oss` |
| `GITHUB_REPO` | `shiftupperformance` |
| `GITHUB_BRANCH` | `main` |
| `NOTIFY_EMAIL` | อีเมลรับแจ้งเตือน (default: p2w.interplus@gmail.com) |
| `NOTIFY_FROM` | ชื่อผู้ส่ง email (default: Shiftup Performance <onboarding@resend.dev>) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token สำหรับ notification |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID ของผู้รับ (`6476070617` — **ห้ามมี tab/space นำหน้า**) |
| `CRON_SECRET` | ป้องกัน `/api/cron-sync` endpoint (ใช้กับ cron-job.org) |

> ⚠️ **Gmail SMTP ใช้ไม่ได้** — ใช้ Resend API แทน (HTTPS port 443)
> ⚠️ **ระวัง hidden characters** ใน env var — เคยเกิดกับ TELEGRAM_CHAT_ID (tab นำหน้า) และอาจเกิดกับตัวอื่นได้ → server.js ใช้ `.trim()` กับทุกค่าแล้ว
> ✅ ทดสอบ Telegram ได้ที่ `/api/test-telegram` | ทดสอบ GitHub ได้ที่ `/api/debug-github`

### cron-job.org (แทน setInterval ที่ใช้ไม่ได้บน Vercel serverless)
- URL: `https://www.shiftupperformance.com/api/cron-sync?secret=<CRON_SECRET>`
- ทุก 30 นาที → sync visits.json + bookings.json ไป GitHub

---

## Architecture

```
src/App.jsx          — React SPA (3500+ บรรทัด)
server.js            — Express server (Vercel serverless via api/index.js)
api/index.js         — Vercel entry point: export default app
vercel.json          — Vercel config: buildCommand, outputDirectory, rewrites
public/content.json  — CMS data (บทความ/portfolio/ราคา/booking config + adminBooked)
public/visits.json   — Visit history สำรอง (GitHub persist ทุก 30 นาที via cron)
public/bookings.json — Booking history (GitHub persist ทุก 30 นาที via cron)
public/sitemap.xml   — Sitemap สำหรับ Google/Bing
public/robots.txt    — บอก crawler ว่า crawl อะไรได้
public/llms.txt      — บอก AI (Perplexity/ChatGPT/Claude) ว่าเว็บทำอะไร
index.html           — SEO meta/OG/JSON-LD + Leaflet CDN
apps-script/Code.gs  — Google Apps Script (อัปเดต manual โดย user)
```

### Vercel vs Railway — ข้อแตกต่างสำคัญ
- **Vercel serverless**: function terminate หลัง `res.json()` → ห้ามใช้ `setImmediate` หรือ fire-and-forget หลัง respond
- ✅ **วิธีแก้**: ใช้ `await Promise.allSettled([...])` ก่อนทุก `res.json()`
- **setInterval ไม่ work** บน Vercel → ใช้ cron-job.org เรียก `/api/cron-sync` แทน
- **visit tracking setImmediate** ยังอยู่ใน `/api/track-visit` — ยังใช้ได้เพราะ res.json() ถูกเรียกก่อน geo lookup แล้ว geo ส่งต่อไป Sheet (อาจไม่ส่งถ้า function ถูก kill เร็วเกิน แต่ยังเก็บใน RAM)

### Content Flow
- เนื้อหา (articles/portfolio/reviews/pricing) โหลดจาก `/content.json`
- แก้ไขผ่าน Admin Panel → POST `/api/save-content` → commit ไป GitHub → Vercel redeploy
- **ไม่ใช้ localStorage** อีกต่อไป
- **Instant refresh**: server เขียน `dist/content.json` ทันทีหลัง commit → F5 ได้ข้อมูลใหม่เลย

### Dashboard Flow
```
Browser → GET /api/get-leads → server.js → Apps Script doGet (ไม่มี params) → Google Sheet
                                         ↓ merge
                             server memory visits (มี geo/ISP)
                             → return รวม → Dashboard แสดงผล
```

### Visit Tracking Flow (แก้จบ 6 มิ.ย. 2569 — ใช้ POST ✅)
```
browser useEffect → POST /api/track-visit → server.js
                         ↓
                    server memory (dashboard)
                         ↓ setImmediate async
                    getGeo(ip) → ip-api.com → province/city/isp
                         ↓
                    POST SHEET_DOGET_URL JSON {source:'visit', page, device, ...}
                         ↓
                    Apps Script doPost → Visits sheet ✅

❌ สิ่งที่ไม่ work (อย่าลองใหม่):
   Browser → Apps Script ทุกชนิด → 400 (Origin header)
   Server GET + query params → 400 (Google block ที่ routing layer ก่อน script run)

✅ สิ่งที่ work:
   Server GET ไม่มี params → 302 → doGet (ใช้สำหรับ dashboard read)
   Server POST JSON {source:'visit'} → doPost → เขียน Visits sheet ✅
```

---

## Components ใน App.jsx (ต้องมีครบทุกตัว)

| Component | หน้าที่ |
|---|---|
| `ShiftupApp` | Router หลัก + navbar + footer + URL routing (pushState) |
| `HomePage` | หน้าแรก |
| `Portfolio3DSlideshow` | 3D coverflow slideshow (portfolio) |
| `ReviewsCarousel` | Infinite auto-scroll reviews |
| `AdminPanel` | Remap admin (articles/portfolio/reviews/brandPricing) |
| `PasswordModal` | Password gate สำหรับทุก admin panel |
| `RemapPage` | หน้า ECU Remap (มีปุ่ม "จองคิวรีแมป" animated border) |
| `HKSAdminPanel` | HKS admin (จัดการ pipes + gallery media + brands) |
| `HKSProductModal` | Modal แสดงรายละเอียดสินค้า HKS (gallery รูป+วิดีโอ) |
| `HKSPage` | หน้า HKS Exhaust |
| `PantheraAdminPanel` | Panthera admin |
| `PantheraPage` | หน้า Panthera |
| `PartnerPage` | หน้าสมัคร Partner |
| `AboutPage` | หน้า About Us (6 sections) |
| `AboutAdminPanel` | About admin |
| `MapPicker` | Leaflet map modal สำหรับเลือกพิกัด GPS (booking form) |
| `CancelPage` | หน้ายกเลิกการจองสำหรับลูกค้า (/cancel URL) — กรอกรหัส 4 หลัก |
| `BookingPage` | หน้าจองคิว ECU Remap (/booking URL) |
| `BookingAdminPanel` | Booking admin (slot config + per-date slot + list จอง) |
| `AnalyticsSection` | กราฟ analytics ใน dashboard (bar chart + trend line + visitor table) |
| `PieChart` | Pie chart ใน dashboard |
| `DashboardPage` | หน้าหลังบ้านเต็ม |

> ⚠️ ถ้า component ใดหายไป → Vercel build พัง

---

## Key Constants (App.jsx)
```js
const LOGO_SRC = '/images/logo.png'
const LINE_URL = 'https://lin.ee/nZOMcph'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec'
const ADMIN_PASS = 'Chev9872'
const HKS_BRANDS = ['Ford','BMW','Honda','Isuzu','Mazda','Mitsubishi','Toyota','Nissan']
// ⚠️ HKS_BRANDS นี้เป็นแค่ fallback — brands จริงอ่านจาก content.json → data.brands
const HKS_PER_PAGE = 12
```

## Helper Functions (App.jsx) — เพิ่ม 13 มิ.ย. 2569
```js
detectMediaType(url)          // 'youtube' | 'video' | 'image'
getYouTubeId(url)             // แกะ video ID จาก youtube.com หรือ youtu.be
getYouTubeEmbed(url, autoplay)// สร้าง embed URL พร้อม autoplay flag
getYtThumb(url)               // ดึง thumbnail จาก YouTube (mqdefault.jpg)
getFirstImage(pipe)           // หารูปแรก (image) จาก pipe.media[] หรือ fallback pipe.imgUrl
```

---

## HKS Product Modal — รายละเอียด (เพิ่ม 13 มิ.ย. 2569)

### Data Structure
```js
pipe.media = [
  { type: 'image', url: 'https://...' },
  { type: 'youtube', url: 'https://youtube.com/...' },
  { type: 'video', url: 'https://...mp4' },
]
// pipe.imgUrl ยังใช้ได้ (backward compat — fallback ถ้า media ว่าง)
```

### Modal Features
- Gallery: ลูกศร ‹ › เลื่อนซ้าย/ขวา + keyboard ArrowLeft/ArrowRight/Esc
- Auto-start ที่ video/YouTube แรก (ถ้ามี) + autoplay
- YouTube: `key={yt-${idx}}` บน iframe → React re-mount → autoplay ทำงาน
- รูปภาพ: ใช้ `WatermarkedImage` (ลายน้ำอัตโนมัติ)
- Thumbnail strip ด้านล่าง + counter "x / total"

### Admin (HKSAdminPanel)
- เพิ่ม media URL → auto-detect ประเภท (YouTube/video/image)
- ลบ media แต่ละรายการ
- **Drag-and-drop** เรียงลำดับ media ได้ (HTML5 DnD API ไม่ใช้ library)
- หน้า grid แสดงรูปแรกที่เป็น image (`getFirstImage`)

---

## Visit Tracking — รายละเอียด

### ข้อมูลที่เก็บ (12 fields)
| Field | ที่มา | Sheet | Dashboard |
|---|---|---|---|
| isoTimestamp | browser (UTC ISO string) | ✅ | ✅ |
| timestamp (th-TH) | server/browser GMT+7 | ✅ | ✅ |
| page | browser | ✅ | ✅ |
| device (mobile/desktop) | browser UA | ✅ | ✅ |
| sessionId | sessionStorage | ✅ | ✅ |
| browser (Chrome/Firefox...) | browser UA | ✅ | ✅ |
| os (Windows/Android...) | browser UA | ✅ | ✅ |
| referrer | document.referrer | ✅ | ✅ |
| language | navigator.language | ✅ | ✅ |
| province (จังหวัด) | ip-api.com (server) | ✅ | ✅ |
| city (เมือง) | ip-api.com (server) | ✅ | ✅ |
| isp (ค่ายมือถือ) | ip-api.com (server) | ✅ | ✅ |

### Bot Filtering (เพิ่ม 19 มิ.ย. 2569)
**BOT_ISP_KEYWORDS** (server.js):
`Amazon.com`, `Amazon Web Services`, `Google LLC`, `Microsoft Corporation`, `OVH SAS`, `Hetzner`, `DigitalOcean`, `Linode`, `Vultr`, `Facebook, Inc.`

### sessionId Logic
- เก็บใน `sessionStorage` key `shiftup_sid`
- ปิด browser tab แล้วเปิดใหม่ = session ใหม่

---

## Booking System — รายละเอียด

### Slot States (admin)
| State | สี | admin เห็น | ลูกค้าเห็น | กดได้ไหม |
|---|---|---|---|---|
| เปิด | 🟢 เขียว | "เปิด" | เลือกได้ | ✅ |
| **adminBooked (บิ้ว)** | 🟠 ส้ม | "บิ้ว" | "จองแล้ว" | ✅ admin เท่านั้น |
| จองแล้ว (จริง) | 🟡 เหลือง | "จองแล้ว" | "จองแล้ว" | ❌ |
| ปิด | ⚫ เทา | "ปิด" | "ปิด" | ✅ admin เท่านั้น |

**วน 3 states**: เปิด → บิ้ว → ปิด → เปิด (กด slot วนไป)
**adminBooked** เก็บใน `config.adminBooked = { "2026-07-12": ["09:00","11:00"] }` ใน content.json
**server.js**: merge `config.adminBooked` เข้า `bookedSlots` ก่อนส่งให้ลูกค้า → ลูกค้าเห็น "จองแล้ว"

### Booking Slot ฝั่งลูกค้า
- **จองแล้ว** (red) = คนจองจริง หรือ admin mark "บิ้ว"
- **ปิด** (grey) = admin ปิด
- ⚡ **Urgency**: เหลือ ≤ 3 slot กระพริบเหลือง
- **ขั้นต่ำ 1 วัน**: ลูกค้าจองได้เร็วสุดคือพรุ่งนี้ (วันนี้เลือกไม่ได้)

### Admin Booking List
- **ซ่อนการจองที่เลยวันแล้ว** — แสดงเฉพาะ `b.date >= today`
- Dashboard booking table: เหมือนกัน

### cancelCode
- สุ่ม 4 หลักตอนจอง → แสดงบน success screen (กล่องสีทอง)
- ลูกค้าถ่ายรูปเก็บเอง — **ไม่ส่ง email/Telegram** ให้ลูกค้า
- ยกเลิกได้ก่อนนัด 12 ชม. เท่านั้น

---

## Timezone — สำคัญมาก ❗

**กฎ**: ทุก timestamp ที่แสดงให้ user ต้องเป็น **GMT+7 (Asia/Bangkok)** เสมอ

```javascript
// ✅ วิธีที่ถูก
new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
// ❌ วิธีที่ผิด — ได้ UTC (เร็วกว่าไทย -7 ชม.)
new Date().toLocaleString('th-TH')
```

---

## Email Notification — Resend API

### Email Flow
```
App.jsx form submit
  ↓
submitToSheets(data) → Apps Script doPost → บันทึก Sheet (ไม่ส่ง email)
notifyServer(data)   → /api/notify-lead  → Resend API → อีเมล 1 ฉบับ ✅
```

> ❌ **อย่าเพิ่ม sendEmail() กลับไปใน Code.gs doPost** — จะทำให้ email ซ้ำ 2 ฉบับ

### ทดสอบ
- Email: `/api/test-email`
- Telegram: `/api/test-telegram`
- GitHub config: `/api/debug-github`

---

## Visit Persistence

### Server Memory
- `let visits = []` — เก็บใน RAM ของ Vercel serverless (reset เมื่อ function cold start)
- โหลดข้อมูลเก่าจาก GitHub `public/visits.json` ตอน startup
- บันทึกกลับ GitHub ผ่าน `/api/cron-sync` (cron-job.org ทุก 30 นาที)

### GitHub `public/visits.json`
- format: `{ visits: [...], botVisits: [...] }`
- cron commit: `analytics: sync visits (N total, M bots)`

---

## Apps Script — สรุป endpoint ที่ใช้งาน

| Method | params/body | ผล | ใช้ทำอะไร |
|---|---|---|---|
| GET | ไม่มี params | ✅ 302 → doGet | อ่านข้อมูล dashboard (leads + visits) |
| GET | **มี params** | ❌ **400** | **ห้ามใช้** — Google block ทุกกรณี |
| POST | `{source:'remap'}` | ✅ doPost | บันทึก Remap Lead |
| POST | `{source:'partner'}` | ✅ doPost | บันทึก Partner Application |
| POST | `{source:'visit'}` | ✅ doPost | บันทึก Visit ลง Visits sheet |
| POST | `{source:'booking'}` | ✅ doPost | บันทึก Booking ลง Bookings sheet |
| POST | `{source:'cancel-booking', id, date, time}` | ✅ doPost | อัปเดตสถานะ cancelled ✅ deploy แล้ว |

---

## SEO — สรุป

| ไฟล์ | สำหรับใคร | สถานะ |
|---|---|---|
| `index.html` | Google + LINE/FB preview | ✅ |
| `public/sitemap.xml` | Google, Bing | ✅ |
| `public/robots.txt` | ทุก crawler | ✅ |
| `public/llms.txt` | AI (Perplexity, ChatGPT, Claude) | ✅ |
| `public/images/og-cover.png` | OG image 1200×630px | ✅ |

- Canonical URL: `https://www.shiftupperformance.com`
- Google Search Console: verify + submit sitemap แล้ว
- Google Business Profile: สร้างแล้ว

---

## Dashboard Features

### AnalyticsSection
- Bar chart visits รายวัน (7/14/30 วัน) + Trend line (linear regression)
- Visitor Details Table — pagination 10/25/50 rows
- Column filter dropdowns + click-to-filter จากสถิติ
- Bot counter card แยกจากคนจริง

### DashboardPage — Booking section
- 4 summary cards: ทั้งหมด / วันนี้ / ยืนยัน / ยกเลิก
- ตาราง "การจองคิวรีแมป" — **แสดงเฉพาะการจองที่ยังไม่เลยวัน**
- ลิงก์ 📍 แผนที่ในตาราง

---

## Watermark — ข้อมูลสำคัญ

- **Component**: `WatermarkedImage` — อยู่ต้น App.jsx
- **ค่าที่ใช้**: opacity 22%, เฉียง -30°, ระยะห่าง 1.5x, ขนาดโลโก้ 28%
- **ใช้กับ**: Portfolio (3D Slideshow) + HKS product grid + HKS product modal (รูปเท่านั้น)
- **Panthera**: ยังไม่ได้ทำ (user บอกทำทีหลัง)
- **โลโก้ที่ใช้**: `/images/logo.png`

---

## Logo Sizes (App.jsx)
| ตำแหน่ง | Class | px |
|---|---|---|
| Navbar | `h-20` | 80px |
| Footer | `h-24` | 96px |

---

## Features ที่ทำเสร็จแล้ว
- [x] 3D Coverflow Portfolio Slideshow (auto-play 3.5s, ◀▶ + dots)
- [x] Infinite auto-scroll Reviews Carousel (pause on hover, 9s/card)
- [x] Brand tab pricing (Mazda/Honda/Toyota ฯลฯ) — editable
- [x] Google Sheets integration (Remap + Partner forms)
- [x] Email notification via **Resend API** → `p2w.interplus@gmail.com` ✅
- [x] Telegram notification → Bot API ✅
- [x] Visit analytics tracking — track เฉพาะหน้าแรกเท่านั้น
- [x] Admin Dashboard (Analytics bar chart + trend line + visitor table + pie chart)
- [x] Hidden dashboard gear button (หน้าแรก มุมล่างขวา)
- [x] Password-protected admin panels ทุกหน้า
- [x] Watermark อัตโนมัติ (Portfolio + HKS) — `WatermarkedImage` component
- [x] โลโก้ใหม่ `public/images/logo.png` + ขนาด navbar h-20, footer h-24
- [x] Visit tracking: browser→server→Apps Script doPost→Sheet ✅
- [x] Visit persistence: GitHub `public/visits.json` (save ทุก 30 นาที via cron)
- [x] IP Geolocation: จังหวัด/เมือง/ISP via ip-api.com
- [x] ISP field + Language field ใน Visits (12 columns)
- [x] Column filter dropdowns ในตาราง visitor details (Dashboard)
- [x] Click-to-filter จากสถิติ "หน้าที่เข้าชมมากสุด"
- [x] Dashboard Sheet: Remap + Partner สองตารางเรียงซ้าย-ขวา
- [x] Timezone GMT+7 ทุก timestamp (server.js + Code.gs + App.jsx)
- [x] HKS admin: จัดการ brand tabs แบบ dynamic (เพิ่ม/ลบ brand ได้)
- [x] Admin save: เขียน dist/content.json ทันที → F5 ได้ข้อมูลใหม่เลย
- [x] HKS: ปุ่ม "รายละเอียดสินค้า" + Product Modal (gallery รูป+วิดีโอ, autoplay, keyboard nav)
- [x] HKS Admin: drag-and-drop เรียงลำดับ gallery media (HTML5 DnD)
- [x] SEO: meta tags, Open Graph, JSON-LD (AutoRepair schema), canonical URL
- [x] SEO: sitemap.xml, robots.txt, llms.txt, og-cover.png (1200×630)
- [x] **Domain live**: `www.shiftupperformance.com` — GoDaddy CNAME → Vercel
- [x] **Google Search Console**: verify + submit sitemap แล้ว
- [x] **Google Business Profile**: สร้างแล้ว
- [x] **Remap page restructure**: ย้าย Pricing+Form ขึ้นมาก่อน + บทความเป็น Accordion
- [x] **Bot filtering**: กรอง ISP datacenter ออกจาก visits
- [x] **Bot counter Dashboard**: card 🤖 แยกจากคนจริง follow date filter
- [x] **หน้า About Us**: tab navbar + 6 sections + AboutAdminPanel
- [x] **ระบบจองคิว ECU Remap**: BookingPage + MapPicker + BookingAdminPanel
- [x] **URL Routing**: pushState — /, /remap, /hks, /panthera, /partner, /about, /booking, /cancel
- [x] **MapPicker**: Leaflet + OSM tiles + Nominatim search + draggable pin
- [x] **Per-date slot config**: 3 states (default/custom/closed) + วันที่ปิดบางช่วง
- [x] **Slot display ฝั่งลูกค้า**: จองแล้ว (แดง) vs ปิด (เทา) — คนละสี
- [x] **Admin slot "บิ้ว"**: fake-booked โดย admin — ส้ม, ลูกค้าเห็น "จองแล้ว" เหมือนจองจริง (11 ก.ค. 2569)
- [x] **Slot cycle**: เปิด → บิ้ว → ปิด → เปิด (กดวน 3 states)
- [x] **ขั้นต่ำ 1 วัน**: จองได้เร็วสุดคือพรุ่งนี้
- [x] **ซ่อนการจองเลยวัน**: Admin panel + Dashboard แสดงเฉพาะการจองในอนาคต
- [x] **Urgency UI**: ⚡ เหลือ X ช่อง! กระพริบเมื่อว่าง ≤ 3
- [x] **MapPicker mobile fix**: กดครั้งที่ 2+ เปิดทันที + 5s timeout fallback
- [x] **Loading animation**: racing car SVG + progress bar 7 วิ + ชิปรายละเอียด
- [x] **Navbar**: ปุ่ม "จองคิวรีแมป" แดง เด่น | "ติดต่อเรา" เทา เล็ก
- [x] **Admin cancel → slot ว่างทันที** + duplicate check ข้าม cancelled
- [x] **ระบบลูกค้ายกเลิกเอง**: cancelCode 4 หลัก + `/cancel` page + deadline 12 ชม.
- [x] **Code.gs cancel-booking handler**: update Sheet สถานะ "ยกเลิก" ✅ deploy แล้ว
- [x] **Dashboard Bookings**: 4 summary cards + ตารางจอง + ลิงก์แผนที่
- [x] **Booking form**: LINE ID + รุ่นรถ required + math captcha
- [x] **RemapPage background images**: 4 sections มี bg image (Google Drive thumbnails)
- [x] **Footer**: เบอร์โทร 083-009-2554 เป็น `href="tel:..."` กดโทรได้
- [x] **BookingPage cancel links**: 2 จุด (header text link + success screen button)
- [x] **Migration to Vercel**: Railway หมด trial → ย้าย Vercel ฟรี (11 ก.ค. 2569)
- [x] **Vercel serverless fix**: `Promise.allSettled()` ก่อน `res.json()` ทุก endpoint
- [x] **cron-job.org**: แทน setInterval สำหรับ sync visits/bookings ทุก 30 นาที
- [x] **Debug endpoints**: `/api/test-telegram`, `/api/debug-github`
- [x] **GitHub env var trim**: `.trim()` ทุกค่าใน `ghConf()` + `ghHeaders()` ป้องกัน hidden chars
- [x] **SEO บทความ 40 บทความ**: เพิ่มบทความภาษาไทยครอบคลุมรถทุกรุ่น + HKS + Panthera + FAQ (12 ก.ค. 2569)
- [x] **Article Pagination**: แสดง 8 บทความ/หน้า รวม 5 หน้า พร้อม prev/next + page dots (12 ก.ค. 2569)
- [x] **Remap page reorder**: รีวิว → Portfolio → บทความ → ฟอร์มประเมิน (12 ก.ค. 2569)
- [x] **About Us SEO content**: เพิ่ม section ข้อมูลหนาแน่น ECU deep-dive, brand grid, HKS, Panthera, FAQ, technical keywords (12 ก.ค. 2569)

---

## ค้างอยู่ / ต้องทำ
- [ ] **Watermark สำหรับ Panthera** — user บอกทำทีหลัง
- [ ] **Google Business Profile** — เพิ่มรูปภาพ, เวลาทำการ, คำอธิบายบริการให้ครบ
- [ ] **หน้า About Us** — section ใหม่เพิ่มแล้ว แต่อาจเพิ่มเนื้อหาได้อีก

---

## ประวัติปัญหาและวิธีแก้ (Bug History)

### 🐛 #1 — Gmail SMTP ใช้ไม่ได้บน Railway/Vercel
- **แก้**: เปลี่ยนเป็น Resend API (HTTPS port 443)

### 🐛 #2 — Visit Tracking ไม่ขึ้น Google Sheet
- **Root cause**: Google block ทุก browser request + GET+params → 400
- **แก้**: Server POST JSON `{source:'visit'}` → doPost ✅

### 🐛 #3 — Email แจ้งเตือนซ้ำ 2 ฉบับ
- **สาเหตุ**: ส่งอีเมล 2 ทาง (server.js + Code.gs)
- **แก้**: ลบ sendEmail() ออกจาก Code.gs doPost — **อย่าเพิ่มกลับ**

### 🐛 #4 — Timestamp ผิด timezone
- **แก้**: เติม `{ timeZone: 'Asia/Bangkok' }` ทุกที่

### 🐛 #5 — Booking ไม่บันทึกลง Google Sheet
- **สาเหตุ**: SHEET_DOPOST_URL ชี้ผิด deployment
- **แก้**: ใช้ URL เดียวกับ SHEET_DOGET_URL

### 🐛 #6 — Email/Telegram ไม่ทำงานบน Vercel
- **สาเหตุ**: Vercel serverless terminate process หลัง `res.json()` → setImmediate/fire-and-forget ไม่ทำงาน
- **แก้**: `await Promise.allSettled([...])` ก่อนทุก `res.json()`

### 🐛 #7 — Telegram ไม่ส่ง notification (11 ก.ค. 2569)
- **สาเหตุ**: TELEGRAM_CHAT_ID มี tab character นำหน้า (`\t6476070617`)
- **แก้**: ลบ tab ใน Vercel env var | เพิ่ม `.trim()` ใน code ป้องกันอนาคต
- **ทดสอบ**: `/api/test-telegram`

### 🐛 #8 — "Branch main not found" ตอน admin บันทึก (11 ก.ค. 2569)
- **สาเหตุ**: GitHub env vars อาจมี hidden chars | `ghHeaders()` ไม่ trim token
- **แก้**: เพิ่ม `.trim()` ทั้ง `ghConf()` และ `ghHeaders()` + เพิ่ม detailed error log
- **ทดสอบ**: `/api/debug-github`

---

## สิ่งที่ต้องระวัง

1. **อย่าแตะ server.js SHEET_DOGET_URL** — ใช้ทั้ง dashboard GET + visit tracking POST
2. **อย่าสร้าง branch** — push main ตรงๆ เท่านั้น
3. **Apps Script — user deploy เองด้วยมือ** ไม่ได้ auto-deploy จาก GitHub
4. **content.json** — มีข้อมูลจริงของ user อยู่ ระวังอย่า overwrite ด้วย default data
5. **visits.json / bookings.json** — cron-job.org commit ทุก 30 นาที → ถ้า push conflict ให้ rebase
6. **Browser → Apps Script ทำไม่ได้เลย** — Google block Origin header → 400
7. **ใช้ POST JSON เท่านั้น** สำหรับ write ข้อมูลไป Apps Script
8. **Vercel serverless**: ทุก async operation ต้อง `await` ก่อน `res.json()` — ห้ามใช้ setImmediate หลัง respond
9. **Timestamp ทุกตัว** ต้องระบุ `{ timeZone: 'Asia/Bangkok' }`
10. **SEO files** ใช้ `shiftupperformance.com` เป็น canonical — อย่า overwrite
11. **Leaflet CDN** อยู่ใน `index.html` — อย่าลบ ไม่งั้น MapPicker พัง
12. **cancelCode** — ลูกค้าต้องถ่ายรูปจาก success screen เก็บเอง ไม่ส่ง email
13. **adminBooked (บิ้ว)** — เก็บใน `config.adminBooked` ใน content.json, server merge เข้า bookedSlots ก่อนส่งลูกค้า
14. **Env vars hidden chars** — เคยเกิดกับ TELEGRAM_CHAT_ID (tab) → ถ้า error แปลกๆ ให้เช็ค `/api/debug-github` และ `/api/test-telegram`

---

## วิธีอัปเดต Apps Script (ต้องทำทุกครั้งที่แก้ Code.gs)

```
1. เปิด https://script.google.com → โปรเจกต์ Shiftup
2. ลบโค้ดทั้งหมดใน Code.gs
3. วาง apps-script/Code.gs จาก repo นี้ทับ
4. Deploy → Manage deployments → ✏️ Edit → New version → Deploy
   (ห้ามสร้าง deployment ใหม่ URL จะเปลี่ยน)
5. ทดสอบ:
   - Visits tab มีแถวใหม่
   - Vercel logs: [sheet] status=200 body={"success":true}
   - เวลาใน Sheet ตรงกับเวลาไทย GMT+7
```

---

## Last Session
**วันที่**: 12 ก.ค. 2569 (session 8)

**Session ก่อนหน้า (สรุปย่อ):**
- Session 1-2 (6 มิ.ย.): Visit tracking, email, timezone, Dashboard
- Session 8 มิ.ย. / 9 มิ.ย. (เครื่องอื่น): HKS brand management, instant save
- Session 13 มิ.ย.: HKS Product Modal, SEO
- Session 18 มิ.ย.: Watermark, โลโก้, Domain live, Search Console
- Session 19 มิ.ย.: Remap restructure, Bot filtering
- Session 28 มิ.ย. (เครื่องอื่น): About Us page
- Session 9 ก.ค. S1: ระบบจองคิว, MapPicker, Telegram, cron
- Session 9 ก.ค. S2: Per-date slot, Urgency UI, MapPicker mobile fix
- Session 9 ก.ค. S3: Remap layout, Dashboard Bookings, Sheet bug fix
- Session 9 ก.ค. S4: Loading animation, Navbar buttons, Cancel system
- Session 9 ก.ค. S5: Footer, CTA swap, Captcha, BG images
- Session 10 ก.ค. S6: Code.gs cancel handler, OG Cover Image
- Session 11 ก.ค. S7: Railway→Vercel, บิ้ว slot, Telegram/GitHub fix, debug endpoints

**12 ก.ค. 2569 — Session 8 (session นี้):**
1. **เพิ่มบทความ SEO ครบ 40 บทความ** ใน `remap.articles` (content.json)
   - ก่อนหน้า: 9 บทความ → session นี้เพิ่มเป็น 40 บทความ
   - ครอบคลุม: Mazda CX-5/CX-3/2, Isuzu D-Max/MU-X, Ford Ranger/Raptor, Honda CR-V/HR-V/Civic, Toyota Fortuner/Hilux Revo, Mitsubishi Triton/Pajero, Nissan Terra/Navara/Almera, BMW, Subaru WRX/Forester
   - หัวข้อ FAQ: Stage 1 vs 2, OBD2 vs Chip Tuning, ประกันรถ, เตรียมรถก่อนรีแมป, ดูแลหลังรีแมป, ดีเซล vs เบนซิน, EV/Hybrid, เมื่อไหร่ไม่ควรรีแมป, รู้สึกไม่ต่าง
   - HKS: ท่อดีกว่าท่อเดิมอย่างไร, เสียงกฎหมาย, ดูแลรักษา, ติดตั้ง
   - Panthera: Active Sound คืออะไร, vs ท่อจริง, รองรับรถอะไร, ราคา/ติดตั้ง
   - Tags: KNOWLEDGE / ECU REMAP / HKS / PANTHERA
2. **Article Pagination** (App.jsx — RemapPage)
   - `articlePage` state + `ARTICLES_PER_PAGE = 8`
   - แสดง 8 บทความ/หน้า × 5 หน้า
   - ปุ่ม "ก่อนหน้า ‹" + "ถัดไป ›" + page dots 1-5
   - เปลี่ยนหน้า → accordion พับกลับอัตโนมัติ (reset openArticles)
   - excerpt ใช้ `whitespace-pre-line` แสดง bullet points ถูกต้อง
3. **Remap page reorder** (App.jsx — RemapPage)
   - ลำดับเดิม: Articles → Portfolio → Reviews → Consult Form
   - ลำดับใหม่: **Reviews → Portfolio → Articles (paged) → Consult Form**
4. **About Us SEO content** (App.jsx — AboutPage)
   - เพิ่ม section "ข้อมูลบริการโดยละเอียด" ก่อน section Contact
   - ECU Remap deep-dive: อธิบายทุก Map ที่ปรับ + ผลลัพธ์เป็น %
   - Brand grid: 12 ยี่ห้อที่รองรับ (Toyota Honda Mazda Isuzu Ford Mitsubishi Nissan Subaru BMW Mercedes VW Audi)
   - HKS: ประวัติแบรนด์ + 3 รุ่น
   - Panthera: วิธีทำงาน + เหมาะกับใคร + คุณสมบัติ
   - FAQ 5 ข้อ (เสียหายไหม, เวลา, Restore, ผ่อนค้าง, Coverage)
   - Technical keywords block สำหรับ bot/AI crawl

---

## Article Structure (content.json → remap.articles)
```js
{
  id: number,          // unique ID
  imgUrl: string,      // Google Drive thumbnail URL หรือ '' ถ้าไม่มีรูป
  tag: string,         // 'KNOWLEDGE' | 'ECU REMAP' | 'HKS' | 'PANTHERA'
  title: string,       // หัวข้อบทความ
  excerpt: string,     // เนื้อหา (รองรับ \n สำหรับ bullet points)
}
```
**ปัจจุบัน**: 40 บทความ, แบ่งหน้าละ 8 (5 หน้า)
**แก้ไขบทความ**: ผ่าน Admin Panel → tab Articles (ใน RemapPage admin)
