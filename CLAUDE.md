# Shiftup Performance — Project Memory

## Overview
เว็บไซต์ P2W Interplus — บริการ ECU Remap, HKS Exhaust, Panthera Active Sound
- **URL**: deploy บน Railway (auto-deploy จาก GitHub main)
- **Stack**: React 18 + Vite 5 + Tailwind CSS v3 + Express server

---

## Git Rules — สำคัญมาก ❗
- มีแค่ **`main` branch เดียว** เท่านั้น (ลบ dev ออกแล้ว)
- ทุก commit ให้ push ตรงไป `git push origin main` เลย
- **ห้าม** สร้าง branch ใหม่, ห้าม merge, ห้ามใช้ `--theirs` / `--ours`
- ถ้า pull แล้วมี conflict → แจ้ง user ก่อน อย่าแก้เอง
- Admin panel บันทึกเนื้อหาผ่าน `/api/save-content` → commit ตรงไป GitHub main อัตโนมัติ

---

## URLs ที่สำคัญ

### Apps Script — มี 2 URL อย่าสับสน
| ใช้ที่ไหน | URL |
|---|---|
| **server.js** `/api/get-leads` (dashboard ดึงข้อมูล) | `AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg` |
| **App.jsx** `GOOGLE_SCRIPT_URL` (form submissions) | `AKfycbwMrK1ip9KWPihhA0VAkUMbYrsHBIqRrcsne099n-t0HBkgAKlFtTvhLDl0asMciy0TWw` |

> ⚠️ **ห้ามสลับ URL ทั้งสอง** — URL แรกมี `doGet` (dashboard), URL ที่สองมี `doPost` (forms)

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

## Architecture

```
src/App.jsx          — React SPA (2000+ บรรทัด)
server.js            — Express server (Railway)
public/content.json  — CMS data (บทความ/portfolio/ราคา)
apps-script/Code.gs  — Google Apps Script reference
```

### Content Flow
- เนื้อหา (articles/portfolio/reviews/pricing) โหลดจาก `/content.json`
- แก้ไขผ่าน Admin Panel → POST `/api/save-content` → commit ไป GitHub → Railway redeploy
- **ไม่ใช้ localStorage** อีกต่อไป

### Dashboard Flow
```
Browser → GET /api/get-leads → server.js → Apps Script doGet → Google Sheet → กลับมาแสดง
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
| `AnalyticsSection` | กราฟ analytics ใน dashboard |
| `PieChart` | Pie chart ใน dashboard |
| `DashboardPage` | หน้าหลังบ้านเต็ม |

> ⚠️ ถ้า component ใดหายไป → Railway build พัง ต้องเช็ค `grep -c "const DashboardPage..."` ให้ครบ 15

---

## Key Constants (App.jsx บรรทัด 1-15)
```js
const LOGO_SRC = '/images/logo.png'
const LINE_URL = 'https://lin.ee/nZOMcph'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMrK1ip..../exec'
const ADMIN_PASS = 'Chev9872'
const HKS_BRANDS = ['Ford','BMW','Honda','Isuzu','Mazda','Mitsubishi','Toyota','Nissan']
const HKS_PER_PAGE = 12
```

---

## Features ที่ทำเสร็จแล้ว
- [x] 3D Coverflow Portfolio Slideshow (auto-play 3.5s, ◀▶ + dots)
- [x] Infinite auto-scroll Reviews Carousel (pause on hover, 9s/card)
- [x] Brand tab pricing (Mazda/Honda/Toyota ฯลฯ) — editable
- [x] Google Sheets integration (Remap + Partner forms)
- [x] Email notification → `p2w.interplus@gmail.com`
- [x] Visit analytics tracking (page, device, sessionId)
- [x] Admin Dashboard (Analytics + Leads tables + Pie chart)
- [x] Hidden dashboard gear button (หน้าแรก มุมล่างขวา)
- [x] Password-protected admin panels ทุกหน้า
- [x] Watermark อัตโนมัติ (Portfolio + HKS) — `WatermarkedImage` component
- [x] โลโก้ใหม่ `public/images/logo.png` (อัปเดตแล้ว)

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

## Last Session
**วันที่**: 5 มิ.ย. 2569  
**สิ่งที่ทำไปในsession นี้**:
- เพิ่ม `WatermarkedImage` component — ลายน้ำโลโก้อัตโนมัติบน Portfolio + HKS
- อัปเดตโลโก้ใหม่ `public/images/logo.png`
- ขยายโลโก้ navbar → `h-20` (80px), footer → `h-24` (96px)

**ค้างอยู่ / ยังไม่ได้ทำ**:
- Watermark สำหรับ Panthera (user บอกยังไม่ทำ)
- Dashboard โหลดข้อมูลจาก Sheet ได้หรือยัง — ยังไม่ได้ตรวจสอบ

---

## สิ่งที่ต้องระวัง
1. **อย่าแตะ server.js URL** — ใช้อยู่แล้ว ถ้าเปลี่ยน dashboard พัง
2. **อย่าสร้าง branch** — push main ตรงๆ เท่านั้น
3. **Apps Script** — user deploy เองด้วยมือ ไม่ได้ auto-deploy จาก GitHub
4. **content.json** — มีข้อมูลจริงของ user อยู่ ระวังอย่า overwrite ด้วย default data
