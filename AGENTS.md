# AGENTS.md — Shiftup Performance

คำสั่งสำหรับ AI coding agent (Codex ฯลฯ) ที่ทำงานใน repo นี้

> 📖 **ข้อมูลเต็มทั้งหมดอยู่ที่ [CLAUDE.md](CLAUDE.md)** — อ่านก่อนเริ่มงานทุกครั้ง
> (architecture, env vars, bug history, session log, งานค้าง) — ไฟล์นี้สรุปเฉพาะกฎที่ห้ามพลาด
> เมื่อทำงานเสร็จ ให้อัปเดต **CLAUDE.md** (ไม่ใช่ไฟล์นี้) — หัวข้อ "Last Session", "Features ที่ทำเสร็จแล้ว", "ค้างอยู่ / ต้องทำ"

## โปรเจกต์
เว็บ `www.shiftupperformance.com` — ECU Remap, HKS Exhaust, Panthera Active Sound (P2W Interplus)
- React 18 + Vite 5 + Tailwind v3 (`src/App.jsx` ไฟล์เดียว 3500+ บรรทัด)
- Express (`server.js`) รันเป็น Vercel serverless ผ่าน `api/index.js`
- Deploy: push `main` → Vercel auto-deploy (ไม่ต้อง build เอง)

## วิธีทำงานกับเจ้าของ
- ผู้ใช้สื่อสารภาษาไทย — ตอบเป็นภาษาไทย
- **เสนอแผนก่อน รอ approve แล้วค่อยลงมือ** — อย่าแตะส่วนที่ไม่ได้สั่ง
- ใช้งานหลายเครื่อง → เริ่มงานด้วย `git pull origin main` เสมอ

## Git — ห้ามพลาด
- มีแค่ branch `main` — commit แล้ว `git push origin main` ตรงๆ
- ห้ามสร้าง branch, ห้าม merge, ห้าม `--theirs`/`--ours`
- admin panel + cron-job.org auto-commit เข้า main ตลอด → ถ้า push ไม่ผ่าน `git pull --rebase origin main`
- ถ้า conflict → **หยุด แจ้ง user** อย่าแก้เอง
- อย่า commit ไฟล์ screenshot/preview ที่ค้างอยู่ใน root (`*.png`, `*-preview.html`)

## กฎโค้ด
1. **Vercel serverless**: ทุก async (Telegram/LINE/Email/Sheet/GitHub) ต้อง `await Promise.allSettled([...])` **ก่อน** `res.json()` — ห้าม setImmediate/fire-and-forget, ห้าม setInterval
2. **Timezone**: ทุก timestamp ใช้ `{ timeZone: 'Asia/Bangkok' }`
3. **env var**: อ่านแล้ว `.trim()` ทุกครั้ง (เคยมี tab ซ่อนอยู่)
4. **notification ใหม่**: เช็ค env var ก่อน ถ้าไม่มีให้ warn แล้ว return — ห้าม throw
5. **อย่าแตะ** `SHEET_DOGET_URL` / `SHEET_DOPOST_URL` ใน server.js (ต้องเป็น Apps Script deployment เดียวกัน)
6. **Apps Script**: POST JSON `{source: ...}` เท่านั้น — GET+params และ browser→Apps Script โดยตรงได้ 400 เสมอ
7. **อย่าเพิ่ม sendEmail() ใน `apps-script/Code.gs`** — email จะซ้ำ; Code.gs user deploy เองด้วยมือ
8. **`public/content.json`** มีข้อมูลจริง — ห้าม overwrite ด้วย default data
9. **อย่าลบ Leaflet CDN** ใน `index.html` (MapPicker พัง)
10. ทุก component ที่ระบุใน CLAUDE.md ต้องยังอยู่ใน App.jsx ไม่งั้น build พัง

## ตรวจสอบ
- syntax backend: `node --check server.js`
- **ไม่มี `node_modules` ในเครื่อง** — อย่ารัน `npm run build` local; Vercel build ให้หลัง push (~1-2 นาที)
- หลัง deploy: `/api/test-telegram`, `/api/test-line`, `/api/debug-github`
