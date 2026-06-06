# Shiftup Performance — Project Memory

## Overview
เว็บไซต์ P2W Interplus — บริการ ECU Remap, HKS Exhaust, Panthera Active Sound
- **URL**: deploy บน Railway (auto-deploy จาก GitHub main)
- **Stack**: React 18 + Vite 5 + Tailwind CSS v3 + Express server
- **วันที่อัปเดต**: 6 มิ.ย. 2569

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

### Visit Tracking — Root Cause & Final Fix (6 มิ.ย. 2569 — แก้จบแล้ว ✅)
```
❌ ทุก browser fetch → Apps Script → 400 Bad Request
   เหตุ: Google script.google.com block requests ที่มี Origin header จาก browser
         ไม่ว่าจะเป็น no-cors POST / no-cors GET / Image.src / regular CORS fetch

❌ Server-side GET พร้อม query params → ก็ได้ 400 เช่นกัน!
   เหตุ: Google block GET+params ที่ routing layer ก่อน script จะทำงาน
         (ไม่มีอะไรขึ้นใน Executions log เลย)
         GET ไม่มี params → 302 ✅ (ใช้ได้สำหรับ dashboard read)
         GET มี params → 400 ❌ (ทุก deployment, ทุก URL)

✅ แก้ถาวร: server.js POST JSON {source:'visit'} → doPost ทำงาน ✅
   - browser → POST /api/track-visit → server.js
   - server.js → geo lookup (province/city/isp)
   - server.js → POST SHEET_DOGET_URL {source:'visit', page, device, ...}
   - Apps Script doPost → บันทึก Visits sheet ✅ (รวม province/city/isp ด้วย!)
```

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
apps-script/Code.gs  — Google Apps Script (อัปเดต manual โดย user)
```

### Content Flow
- เนื้อหา (articles/portfolio/reviews/pricing) โหลดจาก `/content.json`
- แก้ไขผ่าน Admin Panel → POST `/api/save-content` → commit ไป GitHub → Railway redeploy
- **ไม่ใช้ localStorage** อีกต่อไป

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
                    POST SHEET_DOGET_URL {source:'visit', page, device, ...}
                         ↓
                    Apps Script doPost → Visits sheet ✅

❌ สิ่งที่ไม่ work (อย่าลองใหม่ — เสียเวลาทั้งวันแล้ว):
   Browser → Apps Script ทุกชนิด → 400 (Origin header)
   Server GET + query params → 400 (Google block ที่ routing layer ก่อน script run)
   Server POST + manual redirect + re-GET → 400 (URL นั้น block params)

✅ สิ่งที่ work:
   Server GET ไม่มี params → 302 → doGet runs (ใช้สำหรับ dashboard read)
   Server POST JSON {source:'visit'} → doPost runs → เขียน Visits sheet ✅
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
| `HKSAdminPanel` | HKS admin |
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
const HKS_PER_PAGE = 12
```

---

## Visit Tracking — รายละเอียด

### ข้อมูลที่เก็บ (12 fields)
| Field | ที่มา | Sheet | Dashboard |
|---|---|---|---|
| isoTimestamp | browser | ✅ | ✅ |
| timestamp (th-TH) | server (จาก isoTimestamp) | ✅ | ✅ |
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

> ✅ Sheet มี province/city/isp ด้วย เพราะ server ส่งไป Apps Script (ไม่ใช่ browser)

### sessionId Logic
- เก็บใน `sessionStorage` key `shiftup_sid`
- ถ้าปิด browser tab แล้วเปิดใหม่ = session ใหม่
- นับ referrer เฉพาะ `isFirst` (session ใหม่เท่านั้น)

### Google Sheet Visits Tab — 12 Columns
```
A: ISO Timestamp | B: วันที่-เวลา | C: หน้า | D: อุปกรณ์ | E: Session ID
F: จังหวัด | G: เมือง | H: Browser | I: OS | J: Referrer | K: ISP | L: ภาษา
```

### Code.gs doPost — source:'visit' handler (บรรทัด 128-143)
```javascript
} else if (data.source === 'visit') {
  migrateVisitsSheet(ss);
  appendRow(ss, 'Visits', [
    data.isoTimestamp, data.timestamp, data.page, data.device,
    data.sessionId, data.province, data.city, data.browser,
    data.os, data.referrer, data.isp, data.language
  ]);
}
```

---

## Email Notification — Resend API

### วิธีทำงาน
- **รูปแบบเก่า**: nodemailer + Gmail SMTP → **ไม่ work** (Railway block SMTP)
- **รูปแบบใหม่**: Resend API → ส่งผ่าน HTTPS port 443 → **work** ✅
- ส่งอีเมลจาก server.js `/api/notify-lead` POST
- App.jsx เรียก `notifyServer(payload)` หลัง form submit (fire-and-forget)

### ทดสอบ Email
เปิด URL: `https://[railway-domain]/api/test-email` — จะส่ง test email ไป NOTIFY_TO

### Apps Script ก็ส่ง email ด้วย (MailApp)
- Code.gs doPost → `sendEmail()` → MailApp — ส่งอีกรอบจาก Apps Script
- แปลว่าถ้า form submit → email จะมาสองทาง (server + Apps Script)
- ถ้าต้องการอันเดียวให้ comment ออกอันใดอันหนึ่ง

---

## Visit Persistence

### Server Memory
- `let visits = []` — เก็บใน RAM ของ Railway server
- โหลดข้อมูลเก่าจาก `public/visits.json` ตอน startup
- บันทึกกลับไป GitHub ทุก 30 นาที (ถ้า visitsDirty = true)
- เก็บสูงสุด 10,000 entries (ตัดแต่เก็บใหม่สุด)

### GitHub `public/visits.json`
- Railway auto-commit ทุก 30 นาที: message `analytics: sync visits (N total)`
- ถ้า push ไม่ได้หลัง Railway commit → `git pull --rebase origin main`

### Google Sheet `Visits` Tab
- **Server.js** ส่งผ่าน POST JSON `{source:'visit'}` → Apps Script doPost (แก้จบ 6 มิ.ย. 2569)
- ข้อมูลถาวร ไม่หายเมื่อ Railway restart
- มีครบ 12 columns รวม province/city/isp

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
- **ใช้กับ**: Portfolio (3D Slideshow) + HKS product grid
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
- [x] Email notification via **Resend API** → `p2w.interplus@gmail.com` ✅
- [x] Visit analytics tracking (page, device, browser, OS, language, referrer, geo)
- [x] Admin Dashboard (Analytics bar chart + trend line + visitor table + pie chart)
- [x] Hidden dashboard gear button (หน้าแรก มุมล่างขวา)
- [x] Password-protected admin panels ทุกหน้า
- [x] Watermark อัตโนมัติ (Portfolio + HKS) — `WatermarkedImage` component
- [x] โลโก้ใหม่ `public/images/logo.png`
- [x] Visit tracking: browser→server→Apps Script doPost→Sheet ✅ (แก้จบ 6 มิ.ย. 2569)
- [x] Visit persistence: GitHub `public/visits.json` (save ทุก 30 นาที)
- [x] IP Geolocation: จังหวัด/เมือง/ISP via ip-api.com
- [x] ISP field + Language field ใน Visits (12 columns)
- [x] Column filter dropdowns ในตาราง visitor details (Dashboard)
- [x] Click-to-filter จากสถิติ "หน้าที่เข้าชมมากสุด"
- [x] Dashboard Sheet: Remap + Partner สองตารางเรียงซ้าย-ขวา

---

## Last Session
**วันที่**: 6 มิ.ย. 2569

**สิ่งที่ทำใน session นี้**:
1. เพิ่ม column filter dropdowns ในตาราง visitor details (Dashboard)
2. เพิ่ม click-to-filter บน "หน้าที่เข้าชมมากสุด" → หัวข้ออื่นจาง + device panel filter
3. แก้ Dashboard Sheet: Remap + Partner สองตารางเรียงซ้าย-ขวา (ไม่มี formula ที่ error)
4. **แก้ visit tracking ลง Sheet (ใช้เวลาเกือบทั้งวัน — แก้จบแล้ว ✅)**:

   **Timeline การ debug:**
   - Browser no-cors POST → 302 redirect → method เปลี่ยนเป็น GET → body หาย → doPost ไม่รับ
   - Browser GET no-cors → 400 (Sec-Fetch-Mode: no-cors)
   - Browser Image.src → 400 (Sec-Fetch-Dest: image)
   - Browser CORS fetch → 400 (มี Origin header)
   - **Root cause #1**: Google block ทุก browser request ที่มี Origin/Sec-Fetch headers
   - แก้: ย้ายไป server-side fetch (Node.js ไม่มี Origin header)
   - Server GET + query params → **ยังได้ 400!** (ทั้ง SHEET_DOGET_URL และ SHEET_DOPOST_URL)
   - ใช้ redirect:'manual' → r1.status=400 location= (empty) → Google block ที่ routing layer
   - **Root cause #2**: Google block GET+params ที่ routing layer ก่อน script run เลย ไม่ว่าจาก browser หรือ server
   - ไม่มีอะไรขึ้นใน Executions log เมื่อ 400
   - **Final fix**: เปลี่ยนจาก GET+params → POST JSON {source:'visit'} ซึ่ง doPost รองรับอยู่แล้ว
   - `[sheet] status=200 body={"success":true}` ✅ + Visits sheet มีแถวใหม่ ✅

5. รวม GOOGLE_SCRIPT_URL เป็น deployment เดียว (AKfycbxGc0JZJkZ0...)

**ค้างอยู่ / ต้องทำ**:
- [ ] Watermark สำหรับ Panthera (user บอกยังไม่ทำ)

---

## สิ่งที่ต้องระวัง

1. **อย่าแตะ server.js SHEET_DOGET_URL** — ใช้ทั้ง dashboard GET + visit tracking POST ถ้าเปลี่ยนพังทั้งคู่
2. **อย่าสร้าง branch** — push main ตรงๆ เท่านั้น
3. **Apps Script** — user deploy เองด้วยมือ ไม่ได้ auto-deploy จาก GitHub
4. **content.json** — มีข้อมูลจริงของ user อยู่ ระวังอย่า overwrite ด้วย default data
5. **visits.json** — Railway commit ทุก 30 นาที → ถ้า push conflict ให้ rebase
6. **Browser → Apps Script ทำไม่ได้เลย** — Google block Origin header → 400
7. **Server GET + params → Apps Script ทำไม่ได้** — Google block ที่ routing layer → 400
8. **ใช้ POST JSON เท่านั้น** สำหรับ write ข้อมูลไป Apps Script (source:'visit', source:'remap', source:'partner')
9. **Gmail SMTP ใช้ไม่ได้** — Railway block SMTP → ใช้ Resend API เท่านั้น

---

## Apps Script — สรุป endpoint ที่ใช้งาน

| Method | params/body | ผล | ใช้ทำอะไร |
|---|---|---|---|
| GET | ไม่มี params | ✅ 302 → doGet | อ่านข้อมูล dashboard (leads + visits) |
| GET | มี params | ❌ 400 | **ห้ามใช้** — Google block |
| POST | `{source:'remap'}` | ✅ doPost | บันทึก Remap Lead |
| POST | `{source:'partner'}` | ✅ doPost | บันทึก Partner Application |
| POST | `{source:'visit'}` | ✅ doPost | บันทึก Visit ลง Visits sheet |

---

## วิธีอัปเดต Apps Script (สำหรับ session ถัดไป)

```
1. เปิด https://script.google.com → โปรเจกต์ Shiftup
2. ลบโค้ดทั้งหมดใน Code.gs
3. วาง apps-script/Code.gs จาก repo นี้ทับ
4. Deploy → Manage deployments → ✏️ Edit → New version → Deploy
   (ห้ามสร้าง deployment ใหม่ URL จะเปลี่ยน)
5. ทดสอบ: เปิดเว็บ → เข้าหน้าต่างๆ → ดู Sheet Visits tab
   ควรมีแถวใหม่เพิ่มขึ้น + header ควรมี 12 columns
   ดู Railway logs: [sheet] status=200 body={"success":true}
```
