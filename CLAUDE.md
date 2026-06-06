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

### Apps Script — ใช้ **URL เดียวกัน** ทุกที่ (อัปเดต 6 มิ.ย. 2569)
| ใช้ที่ไหน | URL (deployment ID) |
|---|---|
| **server.js** `SHEET_DOGET_URL` (dashboard ดึงข้อมูล) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |
| **App.jsx** `GOOGLE_SCRIPT_URL` (remap/partner forms) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |
| **App.jsx** visit tracking GET (useEffect) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |

> ✅ **ตอนนี้ใช้ deployment เดียว** (LEAD) ทุกอย่าง — ไม่ต้องสลับ URL อีกต่อไป
> ⚠️ **อย่าสร้าง deployment ใหม่** — URL จะเปลี่ยน ให้ใช้ Manage deployments → Edit → New version เท่านั้น

### Visit Tracking — แก้ไข Root Cause (6 มิ.ย. 2569)
- **ปัญหาเดิม**: no-cors POST → Apps Script redirect 302 → browser เปลี่ยน POST→GET → `doPost` ไม่ถูกเรียก → body หาย
- **แก้ด้วย**: เปลี่ยนเป็น GET request + URLSearchParams → `doGet action=track` → บันทึกลง Visits sheet ✅

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
Browser → GET /api/get-leads → server.js → Apps Script doGet → Google Sheet
                                         ↓ merge
                             server memory visits (มี geo/ISP)
                             → return รวม → Dashboard แสดงผล
```

### Visit Tracking Flow (สำคัญมาก)
```
หน้าเว็บ (useEffect) → ส่ง 2 ทาง:
  1. POST /api/track-visit  → server memory + geo lookup (IP → จังหวัด/ISP)
  2. POST GOOGLE_SCRIPT_URL → no-cors → Sheet Visits tab (browser ส่งตรง)

❌ Server POST → Apps Script ไม่ work:
   เหตุผล: Node.js follow redirect → POST กลายเป็น GET → body หาย → doPost ไม่ได้รับข้อมูล
✅ Browser no-cors → Apps Script work เหมือน Remap/Partner forms
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
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMrK1ip9KWPihhA0VAkUMbYrsHBIqRrcsne099n-t0HBkgAKlFtTvhLDl0asMciy0TWw/exec'
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
| timestamp (th-TH) | browser | ✅ | ✅ |
| page | browser | ✅ | ✅ |
| device (mobile/desktop) | browser UA | ✅ | ✅ |
| sessionId | sessionStorage | ✅ | ✅ |
| browser (Chrome/Firefox...) | browser UA | ✅ | ✅ |
| os (Windows/Android...) | browser UA | ✅ | ✅ |
| referrer | document.referrer | ✅ | ✅ |
| language | navigator.language | ✅ | ✅ |
| province (จังหวัด) | ip-api.com (server) | ❌ | ✅ |
| city (เมือง) | ip-api.com (server) | ❌ | ✅ |
| isp (ค่ายมือถือ) | ip-api.com (server) | ❌ | ✅ |

> Sheet ไม่มี province/city/isp เพราะ browser ไม่รู้ IP ตัวเอง
> Dashboard มีเพราะ server lookup IP จาก request headers

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
- Browser ส่งตรงผ่าน no-cors POST → Apps Script doPost
- ข้อมูลถาวร ไม่หายเมื่อ Railway restart
- **ต้อง update Apps Script** ถึงจะมี 12 column

---

## Dashboard Features

### AnalyticsSection
- Bar chart แสดง visits รายวัน (7/14/30 วัน)
- **Trend line** — orange dashed line คำนวณด้วย linear regression
- **Visitor Details Table** — แสดงทุก visit พร้อม pagination 10/25/50 rows
  - Columns: วันที่-เวลา, หน้า, อุปกรณ์, Browser, OS, จังหวัด, ISP, ภาษา, ที่มา

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
- [x] Visit tracking dual-send: server memory + direct browser→Sheet (no-cors)
- [x] Visit persistence: GitHub `public/visits.json` (save ทุก 30 นาที)
- [x] IP Geolocation: จังหวัด/เมือง/ISP via ip-api.com
- [x] ISP field + Language field ใน Visits (12 columns)

---

## Last Session
**วันที่**: 6 มิ.ย. 2569

**สิ่งที่ทำในสอง session ล่าสุด**:
1. ค้นพบว่า useEffect ติดตาม visit หายไปหลัง commit วันที่ 4 มิ.ย. → restore กลับมา
2. rebuild ระบบ visit tracking ใหม่ทั้งหมด:
   - เพิ่ม fields: browser, OS, language, referrer, ISP (ip-api.com)
   - Dual-send: server (geo) + browser no-cors (Sheet)
   - Persist ใน GitHub `public/visits.json`
3. เปลี่ยน email จาก nodemailer/Gmail → **Resend API** (Gmail SMTP timeout บน Railway)
4. เพิ่ม Dashboard features: trend line + visitor details table + pagination
5. อัปเดต Apps Script Code.gs: 12-column Visits schema + migrateVisitsSheet

**ค้างอยู่ / ต้องทำ**:
- [ ] **User ต้องอัปเดต Apps Script** (วาง Code.gs ใหม่ + redeploy เป็น New version)
  - ถึงจะมีการบันทึก visit ลง Sheet แบบ 12 columns
  - Sheet ยังมีแค่ 5 columns + ข้อมูลหยุดที่วันที่ 4 มิ.ย.
- [ ] Watermark สำหรับ Panthera (user บอกยังไม่ทำ)

---

## สิ่งที่ต้องระวัง

1. **อย่าแตะ server.js URLs** — `SHEET_DOGET_URL` ใช้อยู่ ถ้าเปลี่ยน dashboard พัง
2. **อย่าสร้าง branch** — push main ตรงๆ เท่านั้น
3. **Apps Script** — user deploy เองด้วยมือ ไม่ได้ auto-deploy จาก GitHub
4. **content.json** — มีข้อมูลจริงของ user อยู่ ระวังอย่า overwrite ด้วย default data
5. **visits.json** — Railway commit ทุก 30 นาที → ถ้า push conflict ให้ rebase
6. **อย่าเปลี่ยน doPost URL** — form submissions (Remap/Partner/Visit) ทุกอย่างใช้ URL เดิม
7. **Server POST → Apps Script ไม่ work** — Node.js follow 302 redirect แล้ว body หาย → ต้องใช้ browser no-cors เท่านั้น
8. **Gmail SMTP ใช้ไม่ได้** — Railway block SMTP → ใช้ Resend API เท่านั้น

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
```
