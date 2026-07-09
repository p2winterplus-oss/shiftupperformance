import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, 'dist')));

// ═══════════════════════════════════════════════════════════════════
//  VISIT TRACKING — server memory + GitHub persistence
//  ไม่พึ่ง Apps Script → ไม่มี CORS / redirect issues เลย
// ═══════════════════════════════════════════════════════════════════

let visits = [];
let botVisits = []; // { isoTimestamp } — bot hits (not sent to Sheet)
let visitsDirty = false;
const geoCache = new Map(); // IP → { province, city, isp }  cache 1hr

const BOT_ISP_KEYWORDS = ['Amazon.com', 'Amazon Web Services', 'Google LLC', 'Microsoft Corporation', 'OVH SAS', 'Hetzner', 'DigitalOcean', 'Linode', 'Vultr', 'Facebook, Inc.'];
const isBot = (isp) => BOT_ISP_KEYWORDS.some(k => (isp || '').includes(k));

// doPost URL — same approach as remap/partner forms (POST body received before redirect ✓)
const SHEET_DOPOST_URL = 'https://script.google.com/macros/s/AKfycbwMrK1ip9KWPihhA0VAkUMbYrsHBIqRrcsne099n-t0HBkgAKlFtTvhLDl0asMciy0TWw/exec';

// ── Helper: parse User-Agent ─────────────────────────────────────
function parseUA(ua = '') {
  let os = 'Other', browser = 'Other';
  if      (/Windows/i.test(ua))     os = 'Windows';
  else if (/Android/i.test(ua))     os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua))    os = 'macOS';
  else if (/Linux/i.test(ua))       os = 'Linux';

  if      (/Edg\//i.test(ua))       browser = 'Edge';
  else if (/OPR|Opera/i.test(ua))   browser = 'Opera';
  else if (/Chrome/i.test(ua))      browser = 'Chrome';
  else if (/Firefox/i.test(ua))     browser = 'Firefox';
  else if (/Safari/i.test(ua))      browser = 'Safari';
  return { os, browser };
}

// ── Helper: IP Geolocation (ip-api.com — ฟรี, ไม่จำกัด req/วัน) ──
async function getGeo(ip) {
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { province: 'localhost', city: '', isp: 'localhost' };
  }
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    // เพิ่ม isp field — รู้ว่าผู้เข้าชมใช้ค่ายไหน (AIS/True/DTAC ฯลฯ)
    const res  = await fetch(`http://ip-api.com/json/${ip}?lang=th&fields=status,regionName,city,isp`);
    const data = await res.json();
    const geo  = data.status === 'success'
      ? { province: data.regionName || '', city: data.city || '', isp: data.isp || '' }
      : { province: '', city: '', isp: '' };
    geoCache.set(ip, geo);
    setTimeout(() => geoCache.delete(ip), 60 * 60 * 1000);
    return geo;
  } catch {
    return { province: '', city: '', isp: '' };
  }
}

// ── Helper: GitHub config ────────────────────────────────────────
function ghConf() {
  return {
    token:  process.env.GITHUB_TOKEN,
    owner:  process.env.GITHUB_OWNER,
    repo:   process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}
function ghHeaders() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}
function visitsUrl() {
  const { owner, repo, branch } = ghConf();
  return {
    url: `https://api.github.com/repos/${owner}/${repo}/contents/public/visits.json`,
    branch,
  };
}

// ── Load historical visits จาก GitHub ตอน startup ───────────────
async function loadVisits() {
  try {
    const { url, branch } = visitsUrl();
    const res = await fetch(`${url}?ref=${branch}`, { headers: ghHeaders() });
    if (res.ok) {
      const file = await res.json();
      const raw  = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      if (Array.isArray(raw)) {
        // old format — visits array only
        visits = [...raw, ...visits];
        console.log(`[visits] loaded ${raw.length} historical visits (old format)`);
      } else {
        // new format — { visits, botVisits }
        visits    = [...(raw.visits    || []), ...visits];
        botVisits = [...(raw.botVisits || []), ...botVisits];
        console.log(`[visits] loaded ${visits.length} visits, ${botVisits.length} bots`);
      }
    } else {
      console.log('[visits] no visits.json yet — starting fresh');
    }
  } catch (err) {
    console.log('[visits] load error:', err.message);
  }
}

// ── Save visits → GitHub ทุก 30 นาที ───────────────────────────
async function saveVisits() {
  if (!visitsDirty || visits.length === 0) return;
  visitsDirty = false;
  try {
    const { url, branch } = visitsUrl();
    const headers = ghHeaders();
    const getRes  = await fetch(`${url}?ref=${branch}`, { headers });
    let sha = null;
    if (getRes.ok) sha = (await getRes.json()).sha;

    const toSave    = visits.length > 10000    ? visits.slice(-10000)    : [...visits];
    const botToSave = botVisits.length > 5000 ? botVisits.slice(-5000) : [...botVisits];
    const payload   = { visits: toSave, botVisits: botToSave };
    const body      = {
      message: `analytics: sync visits (${toSave.length} total, ${botToSave.length} bots)`,
      content:  Buffer.from(JSON.stringify(payload)).toString('base64'),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (putRes.ok) {
      visits = toSave;
      console.log(`[visits] saved ${toSave.length} visits to GitHub`);
    } else {
      visitsDirty = true;
      const e = await putRes.json().catch(() => ({}));
      console.error('[visits] save failed:', e.message || putRes.status);
    }
  } catch (err) {
    visitsDirty = true;
    console.error('[visits] save error:', err.toString());
  }
}

loadVisits();
setInterval(saveVisits, 30 * 60 * 1000);

// ── Apps Script doGet URL (ใช้เขียน visit ไป Sheet ด้วย GET) ────
const SHEET_DOGET_URL = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec';

// ── API: บันทึก visit ────────────────────────────────────────────
app.post('/api/track-visit', async (req, res) => {
  const { page, device, sessionId, isoTimestamp, timestamp, referrer, language } = req.body || {};
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket?.remoteAddress || '';
  const { os, browser } = parseUA(req.headers['user-agent'] || '');
  // ภาษาจาก browser (navigator.language) หรือ fallback จาก Accept-Language header
  const lang = language || (req.headers['accept-language'] || '').split(',')[0] || '';

  const visit = {
    isoTimestamp: isoTimestamp || new Date().toISOString(),
    timestamp:    timestamp    || new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    page:         page         || 'home',
    device:       device       || 'desktop',
    sessionId:    sessionId    || Math.random().toString(36).slice(2),
    province: '', city: '', isp: '',
    browser, os,
    referrer: referrer || '',
    language: lang,
  };

  visits.push(visit);
  visitsDirty = true;
  res.json({ success: true, total: visits.length });

  // Geo lookup async → แล้ว server เรียก Apps Script โดยตรง (ไม่พึ่ง browser เลย)
  // Server-side Node.js fetch ไม่มี Origin/Sec-* headers → Google ไม่ block → 200 OK
  setImmediate(async () => {
    try {
      const geo = await getGeo(ip);
      if (isBot(geo.isp)) {
        const idx = visits.indexOf(visit);
        if (idx > -1) visits.splice(idx, 1);
        botVisits.push({ isoTimestamp: visit.isoTimestamp });
        if (botVisits.length > 5000) botVisits = botVisits.slice(-5000);
        visitsDirty = true; // persist bots too
        console.log(`[bot] filtered: isp=${geo.isp}`);
        return;
      }

      visit.province = geo.province;
      visit.city     = geo.city;
      visit.isp      = geo.isp;

      // บันทึกลง Google Sheet Visits tab ผ่าน Apps Script doPost (source:'visit')
      // POST JSON → doPost ทำงานได้ (เหมือน remap form) — ไม่ต้องใช้ GET+params ที่ Google block
      const trackBody = JSON.stringify({
        source:       'visit',
        isoTimestamp: visit.isoTimestamp,
        timestamp:    new Date(visit.isoTimestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        page:         visit.page,
        device:       visit.device,
        sessionId:    visit.sessionId,
        browser:      visit.browser,
        os:           visit.os,
        referrer:     visit.referrer,
        language:     visit.language,
        province:     visit.province,
        city:         visit.city,
        isp:          visit.isp,
      });
      console.log(`[sheet] POST visit: page=${visit.page} province=${visit.province}`);
      const r = await fetch(SHEET_DOGET_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    trackBody,
      });
      const txt = await r.text();
      console.log(`[sheet] status=${r.status} body=${txt.substring(0, 60)}`);
    } catch (e) {
      console.error('[track-visit] geo error:', e.message);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  EMAIL NOTIFICATION — Resend API (HTTPS, ไม่โดน block จาก Railway)
//  ต้องตั้ง env var ใน Railway: RESEND_API_KEY
//  สมัครฟรีที่ resend.com → Dashboard → API Keys → Create API Key
// ═══════════════════════════════════════════════════════════════════

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Su-nW33_bmmE-RUDy0xVf7ppiee4g9RuuA5HcIgyN6E';
const NOTIFY_TO   = process.env.NOTIFY_EMAIL  || 'p2w.interplus@gmail.com';
const NOTIFY_FROM = process.env.NOTIFY_FROM   || 'Shiftup Performance <onboarding@resend.dev>';

async function sendEmail(subject, text) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set in Railway env vars');
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from: NOTIFY_FROM, to: [NOTIFY_TO], subject, text });
  if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
  return result;
}

// ── API: ทดสอบ Email — เปิด URL นี้ใน browser เพื่อเช็ค config ───
app.get('/api/test-email', async (req, res) => {
  if (!process.env.RESEND_API_KEY) {
    return res.json({
      success: false,
      error: 'ยังไม่ได้ตั้ง RESEND_API_KEY ใน Railway env vars',
      steps: ['1. ไปที่ resend.com → สมัครฟรี', '2. Dashboard → API Keys → Create API Key', '3. Copy key → วางใน Railway env vars ชื่อ RESEND_API_KEY'],
    });
  }
  try {
    await sendEmail(
      '✅ [Shiftup] ทดสอบ Email — ระบบ OK',
      `ทดสอบระบบ email notification\nส่งหา: ${NOTIFY_TO}\n\nถ้าได้รับ email นี้ แสดงว่าระบบทำงานถูกต้อง ✅`
    );
    res.json({ success: true, message: `✅ ส่ง email ไปที่ ${NOTIFY_TO} แล้ว — ตรวจ inbox/spam` });
  } catch (err) {
    res.json({ success: false, error: err.toString() });
  }
});

// ── API: แจ้งเตือน Lead ใหม่ (เรียกหลัง form submit) ─────────────
app.post('/api/notify-lead', async (req, res) => {
  const d = req.body || {};
  let subject = '', text = '';

  if (d.source === 'remap') {
    subject = '🔧 [Shiftup] ลูกค้าใหม่ขอประเมิน Remap!';
    text =
      `📋 ข้อมูลลูกค้าใหม่ — ECU Remap\n` +
      `─────────────────────────────────\n` +
      `⏰ เวลา      : ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n` +
      `👤 ชื่อ      : ${d.name     || '-'}\n` +
      `📞 ติดต่อ    : ${d.contact  || '-'}\n` +
      `🚗 รุ่นรถ    : ${d.car      || '-'}\n` +
      `📍 สถานที่   : ${d.location || '-'}\n` +
      `📝 รายละเอียด: ${d.detail   || '-'}\n` +
      `─────────────────────────────────\n` +
      `→ ดูข้อมูลทั้งหมด: ${SHEET_URL}`;
  } else if (d.source === 'partner') {
    subject = '🤝 [Shiftup] มีผู้สมัคร Partner ใหม่!';
    text =
      `📋 ข้อมูลผู้สมัคร Partner\n` +
      `─────────────────────────────────\n` +
      `⏰ เวลา      : ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n` +
      `🏪 ชื่อร้าน  : ${d.shopName    || '-'}\n` +
      `👤 ผู้ติดต่อ : ${d.contactName || '-'}\n` +
      `📞 เบอร์โทร  : ${d.phone       || '-'}\n` +
      `💬 LINE ID   : ${d.lineId      || '-'}\n` +
      `📍 จังหวัด   : ${d.province    || '-'}\n` +
      `🔧 ความถนัด  : ${d.expertise   || '-'}\n` +
      `📘 Facebook  : ${d.facebook    || '-'}\n` +
      `─────────────────────────────────\n` +
      `→ ดูข้อมูลทั้งหมด: ${SHEET_URL}`;
  } else {
    return res.status(400).json({ success: false, reason: 'unknown source' });
  }

  try {
    await sendEmail(subject, text);
    console.log(`[notify-lead] ✓ email sent: ${subject}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[notify-lead] error:', err.toString());
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  LEADS — Proxy → Apps Script doGet + merge visits from memory
// ═══════════════════════════════════════════════════════════════════

app.get('/api/get-leads', async (req, res) => {
  try {
    const r    = await fetch(SHEET_DOGET_URL, { redirect: 'follow' });
    const data = await r.json();

    // Merge: sheetVisits (historical) + server memory visits (ใหม่)
    // dedup ด้วย isoTimestamp+sessionId เพื่อไม่ให้ซ้ำ
    const sheetVisits = Array.isArray(data.sheetVisits) ? data.sheetVisits : [];
    const memIds      = new Set(visits.map(v => `${v.isoTimestamp}|${v.sessionId}`));
    const uniqueSheet = sheetVisits.filter(v => !memIds.has(`${v.isoTimestamp}|${v.sessionId}`));
    const allVisits   = [...uniqueSheet, ...visits]
      .sort((a, b) => new Date(a.isoTimestamp) - new Date(b.isoTimestamp));

    res.json({
      ...data,
      visits:    allVisits,
      botVisits: botVisits,
      counts:    { ...data.counts, visits: allVisits.length },
    });
  } catch (err) {
    res.status(500).json({
      error: err.toString(),
      remapLeads: [], partnerApplications: [],
      visits,
      botVisits,
      counts: { remap: 0, partner: 0, visits: visits.length },
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  SAVE CONTENT → GitHub commit
// ═══════════════════════════════════════════════════════════════════

app.post('/api/save-content', async (req, res) => {
  try {
    const { section, data } = req.body;
    const { token, owner, repo, branch } = ghConf();
    const filePath = 'public/content.json';
    const apiBase  = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers  = ghHeaders();

    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
    let current = {}, sha = null;
    if (getRes.ok) {
      const file = await getRes.json();
      sha     = file.sha;
      current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    }

    current[section] = data;

    const body = {
      message: `content: update ${section} via admin panel`,
      content:  Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ success: false, error: err.message });
    }

    // อัปเดต dist/content.json ทันที → F5 ได้ข้อมูลใหม่เลย ไม่ต้องรอ Railway redeploy
    try {
      const localPath = join(__dirname, 'dist', 'content.json');
      writeFileSync(localPath, JSON.stringify(current, null, 2), 'utf-8');
      console.log(`[save-content] updated local dist/content.json (section: ${section})`);
    } catch (writeErr) {
      console.warn('[save-content] could not write local file:', writeErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  BOOKING SYSTEM
// ═══════════════════════════════════════════════════════════════════

let bookings = [];
let bookingsDirty = false;

function bookingsUrl() {
  const { owner, repo, branch } = ghConf();
  return {
    url: `https://api.github.com/repos/${owner}/${repo}/contents/public/bookings.json`,
    branch,
  };
}

async function loadBookings() {
  try {
    const { url, branch } = bookingsUrl();
    const res = await fetch(`${url}?ref=${branch}`, { headers: ghHeaders() });
    if (res.ok) {
      const file = await res.json();
      const raw  = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      bookings = Array.isArray(raw) ? raw : [];
      console.log(`[bookings] loaded ${bookings.length} bookings`);
    } else {
      console.log('[bookings] no bookings.json yet — starting fresh');
    }
  } catch (err) {
    console.log('[bookings] load error:', err.message);
  }
}

async function saveBookings() {
  if (!bookingsDirty || bookings.length === 0) return;
  bookingsDirty = false;
  try {
    const { url, branch } = bookingsUrl();
    const headers = ghHeaders();
    const getRes  = await fetch(`${url}?ref=${branch}`, { headers });
    let sha = null;
    if (getRes.ok) sha = (await getRes.json()).sha;

    const body = {
      message: `bookings: sync (${bookings.length} total)`,
      content:  Buffer.from(JSON.stringify(bookings, null, 2)).toString('base64'),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (putRes.ok) {
      console.log(`[bookings] saved ${bookings.length} bookings to GitHub`);
    } else {
      bookingsDirty = true;
      const e = await putRes.json().catch(() => ({}));
      console.error('[bookings] save failed:', e.message || putRes.status);
    }
  } catch (err) {
    bookingsDirty = true;
    console.error('[bookings] save error:', err.toString());
  }
}

loadBookings();
setInterval(saveBookings, 30 * 60 * 1000);

// ── Telegram notification ─────────────────────────────────────────
async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.warn('[telegram] send error:', err.message);
  }
}

// ── GET /api/booking-config → config + booked slots ─────────────
app.get('/api/booking-config', async (req, res) => {
  try {
    const { owner, repo, branch } = ghConf();
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/public/content.json`;
    const getRes  = await fetch(`${apiBase}?ref=${branch}`, { headers: ghHeaders() });
    let config = {
      advanceDays: 30,
      defaultSlots: ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00'],
      closedDates: [],
      customSlots: {},
    };
    if (getRes.ok) {
      const file    = await getRes.json();
      const content = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      if (content.booking) config = content.booking;
    }

    // Build booked slots map { "2026-07-15": ["09:00", "10:30"] }
    const bookedSlots = {};
    for (const b of bookings) {
      if (!bookedSlots[b.date]) bookedSlots[b.date] = [];
      bookedSlots[b.date].push(b.time);
    }

    res.json({ config, bookedSlots });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ── POST /api/book → create booking ─────────────────────────────
app.post('/api/book', async (req, res) => {
  try {
    const { date, time, name, phone, lineId, carModel, carYear, carColor, note, locationName, locationUrl } = req.body || {};
    if (!date || !time || !name || !phone) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจว่า slot ซ้ำไหม
    const already = bookings.find(b => b.date === date && b.time === time);
    if (already) return res.status(409).json({ success: false, error: 'เวลานี้มีคนจองแล้ว' });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const booking = {
      id, date, time, name, phone,
      lineId: lineId || '',
      carModel: carModel || '',
      carYear: carYear || '',
      carColor: carColor || '',
      note: note || '',
      locationName: locationName || '',
      locationUrl: locationUrl || '',
      isoTimestamp: new Date().toISOString(),
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
      status: 'confirmed',
    };
    bookings.push(booking);
    bookingsDirty = true;

    // Notification (fire-and-forget)
    setImmediate(async () => {
      const locLine = locationName || locationUrl
        ? `\n📍 สถานที่    : ${locationName || ''}${locationName && locationUrl ? '\n🗺 พิกัด       : ' + locationUrl : locationUrl ? locationUrl : ''}`
        : '';
      const msg = `📅 <b>จองคิวใหม่!</b>\nวันที่: ${date} เวลา: ${time}\nชื่อ: ${name}\nโทร: ${phone}\nLine: ${lineId || '-'}\nรถ: ${carModel} ${carYear} ${carColor}${locLine}\nหมายเหตุ: ${note || '-'}`;
      await sendTelegram(msg);

      // Email via Resend
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        try {
          const resend = new Resend(resendKey);
          const mapLink = locationUrl ? `<a href="${locationUrl}">${locationUrl}</a>` : '-';
          await resend.emails.send({
            from: process.env.NOTIFY_FROM || 'Shiftup Performance <onboarding@resend.dev>',
            to: [process.env.NOTIFY_EMAIL || 'p2w.interplus@gmail.com'],
            subject: `📅 จองคิว: ${name} — ${date} ${time}`,
            html: `<h2>จองคิวรีแมปใหม่</h2><table style="border-collapse:collapse;width:100%"><tr><td style="padding:6px 12px;color:#666"><b>วันที่</b></td><td style="padding:6px 12px">${date}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>เวลา</b></td><td style="padding:6px 12px">${time}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>ชื่อ</b></td><td style="padding:6px 12px">${name}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>โทร</b></td><td style="padding:6px 12px">${phone}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>Line ID</b></td><td style="padding:6px 12px">${lineId || '-'}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>รถ</b></td><td style="padding:6px 12px">${carModel} ${carYear} ${carColor}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>สถานที่</b></td><td style="padding:6px 12px">${locationName || '-'}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>พิกัด</b></td><td style="padding:6px 12px">${mapLink}</td></tr><tr><td style="padding:6px 12px;color:#666"><b>หมายเหตุ</b></td><td style="padding:6px 12px">${note || '-'}</td></tr></table>`,
          });
        } catch (e) {
          console.warn('[booking] email error:', e.message);
        }
      }

      // Save to Google Sheet
      try {
        await fetch(SHEET_DOPOST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'booking', ...booking }),
        });
      } catch (e) {
        console.warn('[booking] sheet error:', e.message);
      }

      // Persist to GitHub now
      await saveBookings();
    });

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// ── POST /api/save-booking-config → admin saves slot config ──────
app.post('/api/save-booking-config', async (req, res) => {
  try {
    const { config } = req.body || {};
    if (!config) return res.status(400).json({ success: false, error: 'missing config' });

    const { token, owner, repo, branch } = ghConf();
    const filePath = 'public/content.json';
    const apiBase  = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers  = ghHeaders();

    const getRes  = await fetch(`${apiBase}?ref=${branch}`, { headers });
    let current = {}, sha = null;
    if (getRes.ok) {
      const file = await getRes.json();
      sha     = file.sha;
      current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    }

    current.booking = config;

    const body = {
      message: 'booking: update slot config via admin panel',
      content:  Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!putRes.ok) {
      const err = await putRes.json();
      return res.status(500).json({ success: false, error: err.message });
    }

    // Instant local update
    try {
      const localPath = join(__dirname, 'dist', 'content.json');
      writeFileSync(localPath, JSON.stringify(current, null, 2), 'utf-8');
    } catch {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// ── GET /api/bookings → admin views all bookings ─────────────────
app.get('/api/bookings', (_req, res) => {
  res.json({ bookings });
});

// ── POST /api/cancel-booking → admin cancels a booking ───────────
app.post('/api/cancel-booking', (req, res) => {
  const { id } = req.body || {};
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ success: false });
  bookings[idx].status = 'cancelled';
  bookingsDirty = true;
  res.json({ success: true });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shiftup Performance server running on port ${PORT}`);
});
