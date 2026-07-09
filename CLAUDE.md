# Shiftup Performance — Project Memory

## Overview
เว็บไซต์ P2W Interplus — บริการ ECU Remap, HKS Exhaust, Panthera Active Sound
- **URL**: deploy บน Railway (auto-deploy จาก GitHub main)
- **Domain**: `www.shiftupperformance.com` — live แล้ว (18 มิ.ย. 2569)
- **Stack**: React 18 + Vite 5 + Tailwind CSS v3 + Express server
- **วันที่อัปเดต**: 9 ก.ค. 2569

---

## Git Rules — สำคัญมาก ❗
- มีแค่ **`main` branch เดียว** เท่านั้น (ลบ dev ออกแล้ว)
- ทุก commit ให้ push ตรงไป `git push origin main` เลย
- **ห้าม** สร้าง branch ใหม่, ห้าม merge, ห้ามใช้ `--theirs` / `--ours`
- ถ้า pull แล้วมี conflict → แจ้ง user ก่อน อย่าแก้เอง
- Admin panel บันทึกเนื้อหาผ่าน `/api/save-content` → commit ตรงไป GitHub main อัตโนมัติ
- Railway บางที auto-commit `analytics: sync visits` → ถ้า push ไม่ได้ให้ `git pull --rebase origin main` ก่อน

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

## Railway Environment Variables (สำคัญ — ต้องตั้งทุกตัว)
| ชื่อตัวแปร | ใช้ทำอะไร |
|---|---|
| `RESEND_API_KEY` | Email notification ผ่าน Resend API (re...xxxx) |
| `GITHUB_TOKEN` | บันทึก visits.json + content.json ไป GitHub |
| `GITHUB_OWNER` | GitHub username (เจ้าของ repo) |
| `GITHUB_REPO` | ชื่อ repo |
| `GITHUB_BRANCH` | `main` |
| `NOTIFY_EMAIL` | อีเมลรับแจ้งเตือน (default: p2w.interplus@gmail.com) |
| `NOTIFY_FROM` | ชื่อผู้ส่ง email (default: Shiftup Performance <onboarding@resend.dev>) |

> ⚠️ **Gmail SMTP ใช้ไม่ได้บน Railway** — Railway block SMTP port 465/587 ทำให้ nodemailer timeout
> ✅ **ใช้ Resend API แทน** (HTTPS port 443) — สมัครฟรีที่ resend.com

---

## Architecture

```
src/App.jsx          — React SPA (2000+ บรรทัด)
server.js            — Express server (Railway)
public/content.json  — CMS data (บทความ/portfolio/ราคา)
public/visits.json   — Visit history สำรอง (GitHub persist ทุก 30 นาที)
public/sitemap.xml   — Sitemap สำหรับ Google/Bing
public/robots.txt    — บอก crawler ว่า crawl อะไรได้
public/llms.txt      — บอก AI (Perplexity/ChatGPT/Claude) ว่าเว็บทำอะไร
index.html           — SEO meta/OG/JSON-LD ทั้งหมดอยู่ที่นี่
apps-script/Code.gs  — Google Apps Script (อัปเดต manual โดย user)
```

### Content Flow
- เนื้อหา (articles/portfolio/reviews/pricing) โหลดจาก `/content.json`
- แก้ไขผ่าน Admin Panel → POST `/api/save-content` → commit ไป GitHub → Railway redeploy
- **ไม่ใช้ localStorage** อีกต่อไป
- **Instant refresh** (แก้ 9 มิ.ย. 2569): server เขียน `dist/content.json` ทันทีหลัง commit → F5 ก่อน Railway rebuild เสร็จก็ได้ข้อมูลใหม่เลย ไม่ต้องรอ 2-3 นาที

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
| `ShiftupApp` | Router หลัก + navbar + footer + dashboard gear button |
| `HomePage` | หน้าแรก |
| `Portfolio3DSlideshow` | 3D coverflow slideshow (portfolio) |
| `ReviewsCarousel` | Infinite auto-scroll reviews |
| `AdminPanel` | Remap admin (articles/portfolio/reviews/brandPricing) |
| `PasswordModal` | Password gate สำหรับทุก admin panel |
| `RemapPage` | หน้า ECU Remap |
| `HKSAdminPanel` | HKS admin (จัดการ pipes + gallery media + brands) |
| `HKSProductModal` | Modal แสดงรายละเอียดสินค้า HKS (gallery รูป+วิดีโอ) |
| `HKSPage` | หน้า HKS Exhaust |
| `PantheraAdminPanel` | Panthera admin |
| `PantheraPage` | หน้า Panthera |
| `PartnerPage` | หน้าสมัคร Partner |
| `AnalyticsSection` | กราฟ analytics ใน dashboard (bar chart + trend line + visitor table) |
| `PieChart` | Pie chart ใน dashboard |
| `DashboardPage` | หน้าหลังบ้านเต็ม |

> ⚠️ ถ้า component ใดหายไป → Railway build พัง

---

## Key Constants (App.jsx)
```js
const LOGO_SRC = '/images/logo.png'
const LINE_URL = 'https://lin.ee/nZOMcph'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec'
const ADMIN_PASS = 'Chev9872'
const HKS_BRANDS = ['Ford','BMW','Honda','Isuzu','Mazda','Mitsubishi','Toyota','Nissan']
// ⚠️ HKS_BRANDS นี้เป็นแค่ fallback — brands จริงอ่านจาก content.json → data.brands
// แก้ไขผ่าน HKSAdminPanel (เพิ่ม/ลบ brand tab ได้)
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
// pipe.media = array ของ media items (ใหม่)
pipe.media = [
  { type: 'image', url: 'https://...' },
  { type: 'youtube', url: 'https://youtube.com/...' },
  { type: 'video', url: 'https://...mp4' },
]
// pipe.imgUrl ยังใช้ได้ (backward compat — fallback ถ้า media ว่าง)
```

### Modal Features
- เปิดจากปุ่ม **"รายละเอียดสินค้า"** (เปลี่ยนจาก "เช็คสต๊อกและราคา")
- Gallery: ลูกศร ‹ › เลื่อนซ้าย/ขวา + keyboard ArrowLeft/ArrowRight/Esc
- Auto-start ที่ video/YouTube แรก (ถ้ามี) + autoplay
- YouTube: `key={yt-${idx}}` บน iframe → React re-mount → autoplay ทำงาน
- รูปภาพ: ใช้ `WatermarkedImage` (ลายน้ำอัตโนมัติ)
- Thumbnail strip ด้านล่าง + counter "x / total"
- ปุ่ม LINE CTA ใน modal

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
```
มี visit เข้ามา → getGeo(ip) → เช็ค ISP
  ├─ ISP เป็น bot → ลบออกจาก visits[], เพิ่ม botVisits[] ({ isoTimestamp })
  │                  ไม่ส่งไป Sheet
  │                  visitsDirty = true → บันทึกลง visits.json ทุก 30 นาที ✅
  └─ ISP คนจริง → บันทึกปกติ → Sheet + visits.json
```

**BOT_ISP_KEYWORDS** (server.js):
`Amazon.com`, `Amazon Web Services`, `Google LLC`, `Microsoft Corporation`, `OVH SAS`, `Hetzner`, `DigitalOcean`, `Linode`, `Vultr`, `Facebook, Inc.`

**botVisits** — เก็บใน RAM เท่านั้น (reset เมื่อ Railway restart) เก็บแค่ `{ isoTimestamp }` สูงสุด 5,000 entries ไม่ได้บันทึกลง visits.json

### sessionId Logic
- เก็บใน `sessionStorage` key `shiftup_sid`
- ถ้าปิด browser tab แล้วเปิดใหม่ = session ใหม่
- นับ referrer เฉพาะ `isFirst` (session ใหม่เท่านั้น)

### Google Sheet Visits Tab — 12 Columns
```
A: ISO Timestamp | B: วันที่-เวลา | C: หน้า | D: อุปกรณ์ | E: Session ID
F: จังหวัด | G: เมือง | H: Browser | I: OS | J: Referrer | K: ISP | L: ภาษา
```

---

## Timezone — สำคัญมาก ❗

**กฎ**: ทุก timestamp ที่แสดงให้ user ต้องเป็น **GMT+7 (Asia/Bangkok)** เสมอ

```javascript
// ✅ วิธีที่ถูก — ใช้ทุกที่ใน server.js, App.jsx, Code.gs
new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })

// ❌ วิธีที่ผิด — ได้ UTC (เร็วกว่าไทย -7 ชม.) บน Railway/Google servers
new Date().toLocaleString('th-TH')
```

**isoTimestamp** ยังคงใช้ UTC (`new Date().toISOString()`) — มาตรฐาน ISO8601 ใช้สำหรับ sort/compare
**timestamp** (แสดงผล) ต้องระบุ `{ timeZone: 'Asia/Bangkok' }` เสมอ

---

## Email Notification — Resend API

### วิธีทำงาน
- **รูปแบบเก่า**: nodemailer + Gmail SMTP → **ไม่ work** (Railway block SMTP)
- **รูปแบบใหม่**: Resend API → ส่งผ่าน HTTPS port 443 → **work** ✅
- ส่งอีเมลจาก server.js `/api/notify-lead` POST
- App.jsx เรียก `notifyServer(payload)` หลัง form submit (fire-and-forget)

### Email Flow (แก้จบ — ส่งแค่ 1 ฉบับต่อ submit ✅)
```
App.jsx form submit
  ↓
submitToSheets(data) → Apps Script doPost → บันทึก Sheet (ไม่ส่ง email)
notifyServer(data)   → /api/notify-lead  → Resend API → อีเมล 1 ฉบับ ✅
```

> ❌ **อย่าเพิ่ม sendEmail() กลับไปใน Code.gs doPost** — จะทำให้ email ซ้ำ 2 ฉบับ

### ทดสอบ Email
เปิด URL: `https://[railway-domain]/api/test-email` — จะส่ง test email ไป NOTIFY_TO

---

## Visit Persistence

### Server Memory
- `let visits = []` — เก็บใน RAM ของ Railway server
- โหลดข้อมูลเก่าจาก `public/visits.json` ตอน startup
- บันทึกกลับไป GitHub ทุก 30 นาที (ถ้า visitsDirty = true)
- เก็บสูงสุด 10,000 entries (ตัดแต่เก็บใหม่สุด)

### GitHub `public/visits.json`
- format ใหม่ (19 มิ.ย. 2569): `{ visits: [...], botVisits: [...] }` (เดิมเป็น array visits อย่างเดียว)
- loadVisits() handle ทั้ง format เก่า (array) และ format ใหม่ (object) — backward compatible
- Railway auto-commit ทุก 30 นาที: message `analytics: sync visits (N total, M bots)`
- ถ้า push ไม่ได้หลัง Railway commit → `git pull --rebase origin main`

### Google Sheet `Visits` Tab
- **Server.js** ส่งผ่าน POST JSON `{source:'visit'}` → Apps Script doPost (แก้จบ 6 มิ.ย. 2569)
- ข้อมูลถาวร ไม่หายเมื่อ Railway restart
- มีครบ 12 columns รวม province/city/isp

---

## Apps Script — สรุป endpoint ที่ใช้งาน

| Method | params/body | ผล | ใช้ทำอะไร |
|---|---|---|---|
| GET | ไม่มี params | ✅ 302 → doGet | อ่านข้อมูล dashboard (leads + visits) |
| GET | **มี params** | ❌ **400** | **ห้ามใช้** — Google block ทุกกรณี |
| POST | `{source:'remap'}` | ✅ doPost | บันทึก Remap Lead + (ไม่ส่ง email แล้ว) |
| POST | `{source:'partner'}` | ✅ doPost | บันทึก Partner Application + (ไม่ส่ง email แล้ว) |
| POST | `{source:'visit'}` | ✅ doPost | บันทึก Visit ลง Visits sheet |

---

## SEO — สรุป (เพิ่ม 13 มิ.ย. 2569)

### ไฟล์ที่เกี่ยวข้อง
| ไฟล์ | สำหรับใคร | สถานะ |
|---|---|---|
| `index.html` | Google + LINE/FB preview | ✅ ทำงานได้เลยบน Railway |
| `public/sitemap.xml` | Google, Bing | ✅ เข้าถึงได้ที่ `/sitemap.xml` |
| `public/robots.txt` | ทุก crawler | ✅ เข้าถึงได้ที่ `/robots.txt` |
| `public/llms.txt` | AI (Perplexity, ChatGPT, Claude) | ✅ เข้าถึงได้ที่ `/llms.txt` |

### Canonical URL
- ✅ ชี้ไป `https://www.shiftupperformance.com` ครบทุกไฟล์แล้ว (18 มิ.ย. 2569)
- ✅ Domain live แล้ว — GoDaddy CNAME → Railway
- ✅ Google Search Console: verify + submit sitemap แล้ว
- ✅ Google Business Profile: สร้างแล้ว

### OG Image
- ตอนนี้ใช้ `/images/logo.png` เป็น OG image
- แนะนำ: เพิ่ม `/images/og-cover.jpg` ขนาด **1200×630px** ทีหลัง → preview สวยขึ้นบน LINE/Facebook

---

## Dashboard Features

### AnalyticsSection
- Bar chart แสดง visits รายวัน (7/14/30 วัน)
- **Trend line** — orange dashed line คำนวณด้วย linear regression
- **Visitor Details Table** — แสดงทุก visit พร้อม pagination 10/25/50 rows
  - Columns: วันที่-เวลา, หน้า, อุปกรณ์, Browser, OS, จังหวัด, ISP, ภาษา, ที่มา
- Column filter dropdowns + click-to-filter จากสถิติหน้าที่เข้าชม

### PieChart
- สัดส่วน mobile vs desktop

---

## Watermark — ข้อมูลสำคัญ

- **Component**: `WatermarkedImage` — อยู่ต้น App.jsx (หลัง submitToSheets)
- **ค่าที่ใช้**: opacity 22%, เฉียง -30°, ระยะห่าง 1.5x, ขนาดโลโก้ 28%
- **ใช้กับ**: Portfolio (3D Slideshow) + HKS product grid + HKS product modal (รูปเท่านั้น ไม่ใส่ video)
- **Panthera**: ยังไม่ได้ทำ (ตั้งใจไว้)
- **วิธีทำงาน**: CSS overlay — ไม่มีปัญหา CORS, รูปใหม่ที่เพิ่มทีหลังได้ลายน้ำอัตโนมัติ
- **โลโก้ที่ใช้**: `/images/logo.png`

---

## Logo Sizes (App.jsx)
| ตำแหน่ง | Class | px |
|---|---|---|
| Navbar | `h-20` | 80px (เต็มความสูง navbar) |
| Footer | `h-24` | 96px |

> Navbar container สูง `h-20` (80px) — ถ้าขยายโลโก้เกินนี้ต้องขยาย navbar ด้วย

---

## Features ที่ทำเสร็จแล้ว
- [x] 3D Coverflow Portfolio Slideshow (auto-play 3.5s, ◀▶ + dots)
- [x] Infinite auto-scroll Reviews Carousel (pause on hover, 9s/card)
- [x] Brand tab pricing (Mazda/Honda/Toyota ฯลฯ) — editable
- [x] Google Sheets integration (Remap + Partner forms)
- [x] Email notification via **Resend API** → `p2w.interplus@gmail.com` ✅ (1 ฉบับต่อ submit)
- [x] Visit analytics tracking — track เฉพาะหน้าแรกเท่านั้น (18 มิ.ย. 2569)
- [x] Admin Dashboard (Analytics bar chart + trend line + visitor table + pie chart)
- [x] Hidden dashboard gear button (หน้าแรก มุมล่างขวา)
- [x] Password-protected admin panels ทุกหน้า
- [x] Watermark อัตโนมัติ (Portfolio + HKS) — `WatermarkedImage` component
- [x] โลโก้ใหม่ `public/images/logo.png` + ขนาด navbar h-20, footer h-24
- [x] Visit tracking: browser→server→Apps Script doPost→Sheet ✅
- [x] Visit persistence: GitHub `public/visits.json` (save ทุก 30 นาที)
- [x] IP Geolocation: จังหวัด/เมือง/ISP via ip-api.com
- [x] ISP field + Language field ใน Visits (12 columns)
- [x] Column filter dropdowns ในตาราง visitor details (Dashboard)
- [x] Click-to-filter จากสถิติ "หน้าที่เข้าชมมากสุด"
- [x] Dashboard Sheet: Remap + Partner สองตารางเรียงซ้าย-ขวา
- [x] Timezone GMT+7 ทุก timestamp (server.js + Code.gs + App.jsx)
- [x] HKS admin: จัดการ brand tabs แบบ dynamic (เพิ่ม/ลบ brand ได้ ไม่ hardcode)
- [x] Admin save: เขียน dist/content.json ทันที → F5 ได้ข้อมูลใหม่เลย (ไม่รอ Railway rebuild)
- [x] HKS: ปุ่ม "รายละเอียดสินค้า" + Product Modal (gallery รูป+วิดีโอ, autoplay, keyboard nav)
- [x] HKS: grid แสดงรูปแรกของ gallery อัตโนมัติ (getFirstImage)
- [x] HKS Admin: drag-and-drop เรียงลำดับ gallery media (HTML5 DnD)
- [x] SEO: meta tags, Open Graph, JSON-LD (AutoRepair schema), canonical URL
- [x] SEO: sitemap.xml, robots.txt, llms.txt
- [x] **Domain live**: `www.shiftupperformance.com` (18 มิ.ย. 2569) — GoDaddy → Railway CNAME
- [x] **Google Search Console**: verify + submit sitemap แล้ว
- [x] **Google Business Profile**: สร้างแล้ว (18 มิ.ย. 2569)
- [x] SEO files อัปเดต URL → `www.shiftupperformance.com` ครบทุกไฟล์
- [x] **Remap page restructure** (19 มิ.ย. 2569): ย้าย Pricing+Form ขึ้นมาก่อน + บทความเปลี่ยนเป็น Accordion (พับ/กาง)
- [x] **Bot filtering** (19 มิ.ย. 2569): กรอง bot ISP (Amazon/Google/OVH/Microsoft ฯลฯ) ออกจาก visits — ไม่บันทึกลง Sheet/visits.json
- [x] **Bot counter Dashboard** (19 มิ.ย. 2569): card 🤖 แสดงจำนวน bot วันนี้ + ช่วงที่เลือก แยกจากคนจริง follow date filter
- [x] **หน้า About Us** (28 มิ.ย. 2569): เพิ่ม tab navbar + 6 sections (Hero, Who We Are, Services, Why Us, Policy, Contact) + AboutAdminPanel
- [x] **Footer Quick Links**: เพิ่ม About Us
- [x] **CTA navbar**: เปลี่ยนจาก "ปรึกษาช่างเทคนิค" → "ติดต่อเรา"

---

## ค้างอยู่ / ต้องทำ
- [ ] **OG Cover Image** — เพิ่ม `/images/og-cover.jpg` (1200×630px) เพื่อ LINE/FB preview สวยขึ้น
- [ ] Watermark สำหรับ Panthera (user บอกยังไม่ทำ)
- [ ] Google Business Profile — เพิ่มรูปภาพ, เวลาทำการ, คำอธิบายบริการให้ครบ
- [ ] เนื้อหาบนเว็บ — เพิ่มบทความ/เนื้อหาภาษาไทยให้ Google index ได้ดีขึ้น (สำคัญสำหรับ SEO)

---

## ประวัติปัญหาและวิธีแก้ (Bug History)

### 🐛 #1 — Gmail SMTP ใช้ไม่ได้บน Railway
- **อาการ**: nodemailer timeout ส่ง email ไม่ได้
- **สาเหตุ**: Railway block outbound SMTP port 465/587
- **แก้**: เปลี่ยนเป็น Resend API (HTTPS port 443)

---

### 🐛 #2 — Visit Tracking ไม่ขึ้น Google Sheet (ใช้เวลาทั้งวัน)
**Timeline การ debug:**

| วิธีที่ลอง | ผล | สาเหตุ |
|---|---|---|
| Browser no-cors POST → Apps Script | ❌ | 302 redirect → body หาย → doPost รับข้อมูลไม่ได้ |
| Browser GET no-cors | ❌ 400 | Sec-Fetch-Mode: no-cors → Google block |
| Browser Image.src (pixel tracking) | ❌ 400 | Sec-Fetch-Dest: image → Google block |
| Browser regular CORS fetch | ❌ 400 | มี Origin header → Google block |
| Server GET + query params | ❌ 400 | Google block GET+params ที่ routing layer |
| Server GET + params (URL อื่น) | ❌ 400 | เหมือนกัน ทุก deployment |
| **Server POST JSON {source:'visit'}** | ✅ **200** | doPost รับ JSON body ได้ปกติ |

**Root cause สรุป:**
- Google block **ทุก browser request** ที่มี Origin/Sec-Fetch headers → 400
- Google block **GET พร้อม query params** จากทุกที่ (browser + server) ที่ routing layer → 400
- GET **ไม่มี params** → 302 ผ่านได้ (ใช้สำหรับ dashboard read)
- POST JSON → doPost ทำงานได้ปกติ ✅

---

### 🐛 #3 — Email แจ้งเตือนซ้ำ 2 ฉบับต่อ 1 submit
- **อาการ**: กด submit 1 ครั้ง → ได้ email 2 ฉบับ (คนละ sender)
- **สาเหตุ**: ส่งอีเมล 2 ทาง: server.js → Resend + Code.gs → MailApp
- **แก้**: ลบ `sendEmail()` ออกจาก `doPost` ใน Code.gs ทั้งหมด
- **หมายเหตุ**: อย่าเพิ่มกลับเด็ดขาด — server.js จัดการให้แล้ว

---

### 🐛 #4 — Timestamp ผิด timezone (ช้ากว่าไทย 7 ชั่วโมง)
- **อาการ**: เวลาใน Sheet / อีเมล ช้ากว่าความเป็นจริง 7 ชั่วโมง
- **สาเหตุ**: Railway/Google servers อยู่ใน UTC → `new Date().toLocaleString('th-TH')` ได้ UTC
- **แก้**: เติม `{ timeZone: 'Asia/Bangkok' }` ทุกที่ใน server.js, Code.gs, App.jsx

---

## สิ่งที่ต้องระวัง

1. **อย่าแตะ server.js SHEET_DOGET_URL** — ใช้ทั้ง dashboard GET + visit tracking POST ถ้าเปลี่ยนพังทั้งคู่
2. **อย่าสร้าง branch** — push main ตรงๆ เท่านั้น
3. **Apps Script — user deploy เองด้วยมือ** ไม่ได้ auto-deploy จาก GitHub
4. **content.json** — มีข้อมูลจริงของ user อยู่ ระวังอย่า overwrite ด้วย default data
5. **visits.json** — Railway commit ทุก 30 นาที → ถ้า push conflict ให้ rebase
6. **Browser → Apps Script ทำไม่ได้เลย** — Google block Origin header → 400
7. **Server GET + params → Apps Script ทำไม่ได้** — Google block ที่ routing layer → 400
8. **ใช้ POST JSON เท่านั้น** สำหรับ write ข้อมูลไป Apps Script
9. **Gmail SMTP ใช้ไม่ได้** — Railway block SMTP → ใช้ Resend API เท่านั้น
10. **Timestamp ทุกตัว** ต้องระบุ `{ timeZone: 'Asia/Bangkok' }` ใน server.js และ Code.gs
11. **SEO files** — `index.html`, `sitemap.xml`, `robots.txt`, `llms.txt` ใช้ `shiftupperformance.com` เป็น canonical → อย่า overwrite ด้วย Railway URL

---

## วิธีอัปเดต Apps Script (ต้องทำทุกครั้งที่แก้ Code.gs)

```
1. เปิด https://script.google.com → โปรเจกต์ Shiftup
2. ลบโค้ดทั้งหมดใน Code.gs
3. วาง apps-script/Code.gs จาก repo นี้ทับ
4. Deploy → Manage deployments → ✏️ Edit → New version → Deploy
   (ห้ามสร้าง deployment ใหม่ URL จะเปลี่ยน)
5. ทดสอบ:
   - เปิดเว็บ → เข้าหน้าต่างๆ → ดู Sheet Visits tab ควรมีแถวใหม่
   - ดู Railway logs: [sheet] status=200 body={"success":true}
   - ส่ง form → ได้อีเมล 1 ฉบับ (ไม่ซ้ำ)
   - เวลาใน Sheet / อีเมล ตรงกับเวลาไทย GMT+7
```

---

## Last Session
**วันที่**: 19 มิ.ย. 2569 (session 2)

**6 มิ.ย. 2569 — Session 1:**
1. เพิ่ม column filter dropdowns ในตาราง visitor details (Dashboard)
2. เพิ่ม click-to-filter บน "หน้าที่เข้าชมมากสุด"
3. แก้ Dashboard Sheet: Remap + Partner สองตารางเรียงซ้าย-ขวา
4. ย้าย visit tracking จาก browser มา server-side (แก้ Origin header issue)
5. รวม GOOGLE_SCRIPT_URL เป็น deployment เดียว

**6 มิ.ย. 2569 — Session 2:**
1. แก้ visit tracking ลง Sheet ถาวร: เปลี่ยนจาก GET+params → POST JSON {source:'visit'}
2. แก้ email ซ้ำ: ลบ sendEmail() ออกจาก Code.gs doPost
3. แก้ timezone: เติม `{ timeZone: 'Asia/Bangkok' }` ทุกที่

**8 มิ.ย. 2569 (เครื่องอื่น):**
1. HKS admin: เพิ่ม brand management — เพิ่ม/ลบ brand tab ได้ (ไม่ hardcode แล้ว)

**9 มิ.ย. 2569 (เครื่องอื่น):**
1. Admin save: server เขียน `dist/content.json` ทันทีหลัง GitHub commit → F5 เห็นผลทันที

**13 มิ.ย. 2569:**
1. HKS Product Modal: gallery รูป+วิดีโอ, ลูกศรนำทาง, keyboard nav, YouTube autoplay, thumbnail strip
2. HKS grid: แสดงรูปแรก (image) อัตโนมัติ, ปุ่มเปลี่ยนเป็น "รายละเอียดสินค้า"
3. HKS Admin: drag-and-drop เรียงลำดับ gallery media
4. SEO ครบชุด: index.html (meta/OG/JSON-LD), sitemap.xml, robots.txt, llms.txt

**18 มิ.ย. 2569:**
1. Watermark อัตโนมัติ (Portfolio + HKS) — CSS overlay, opacity 22%, -30°, 1.5x gap
2. โลโก้ใหม่ `public/images/logo.png` + ขยายขนาด navbar h-20 / footer h-24
3. HKS Admin: เพิ่ม/ลบ brand tabs ได้จาก admin panel
4. แก้ F5 หลัง save — server เขียน dist/content.json ทันที ไม่รอ Railway rebuild
5. **Domain live**: `www.shiftupperformance.com` — GoDaddy CNAME → Railway
6. **Google Search Console**: verify + submit sitemap เรียบร้อย
7. **Google Business Profile**: สร้างแล้ว
8. อัปเดต SEO files ทุกไฟล์ → `www.shiftupperformance.com`
9. Visit tracking: เปลี่ยนเป็น track หน้าแรกเท่านั้น (ลด noise)

**19 มิ.ย. 2569:**
1. Remap page: ย้าย Pricing+Form ขึ้นมาก่อน + บทความเปลี่ยนเป็น Accordion (แก้ปัญหามือถือไถเยอะ)
2. Bot filtering: กรอง ISP datacenter (Amazon/Google/OVH/Microsoft ฯลฯ) ออกจาก visits — ไม่บันทึกลง Sheet
3. Bot counter: Dashboard แสดง 🤖 จำนวน bot ที่กรองออก (วันนี้ + ช่วงที่เลือก) แยกจากคนจริง
4. บันทึก memory ลง .claude ครบชุด (user_profile, feedback, project, reference)

**28 มิ.ย. 2569 (เครื่องอื่น):**
1. เพิ่มหน้า About Us — tab navbar (desktop + mobile) + 6 sections + AboutAdminPanel
2. เพิ่ม About Us ใน footer Quick Links
3. เปลี่ยนปุ่ม CTA navbar: "ปรึกษาช่างเทคนิค" → "ติดต่อเรา"
