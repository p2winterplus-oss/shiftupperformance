import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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
let visitsDirty = false;
const geoCache = new Map(); // IP → { province, city }  cache 1hr

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
    return { province: 'localhost', city: '' };
  }
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const res  = await fetch(`http://ip-api.com/json/${ip}?lang=th&fields=status,regionName,city`);
    const data = await res.json();
    const geo  = data.status === 'success'
      ? { province: data.regionName || '', city: data.city || '' }
      : { province: '', city: '' };
    geoCache.set(ip, geo);
    setTimeout(() => geoCache.delete(ip), 60 * 60 * 1000); // expire 1hr
    return geo;
  } catch {
    return { province: '', city: '' };
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
      const file       = await res.json();
      const historical = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      visits = [...historical, ...visits];
      console.log(`[visits] loaded ${historical.length} historical visits`);
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

    const toSave = visits.length > 10000 ? visits.slice(-10000) : [...visits];
    const body   = {
      message: `analytics: sync visits (${toSave.length} total)`,
      content:  Buffer.from(JSON.stringify(toSave)).toString('base64'),
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
  const { page, device, sessionId, isoTimestamp, timestamp, referrer } = req.body || {};
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
           || req.socket?.remoteAddress || '';
  const { os, browser } = parseUA(req.headers['user-agent'] || '');

  const visit = {
    isoTimestamp: isoTimestamp || new Date().toISOString(),
    timestamp:    timestamp    || new Date().toLocaleString('th-TH'),
    page:         page    || 'home',
    device:       device  || 'desktop',
    sessionId:    sessionId || Math.random().toString(36).slice(2),
    province: '', city: '',
    browser, os,
    referrer: referrer || '',
  };

  visits.push(visit);
  visitsDirty = true;
  res.json({ success: true, total: visits.length });

  // Geo + Sheet write (async หลัง response — ไม่บล็อก client)
  setImmediate(async () => {
    try {
      const geo = await getGeo(ip);
      visit.province = geo.province;
      visit.city     = geo.city;

      // เขียนลง Google Sheet ผ่าน Apps Script doGet (GET = ไม่มี redirect issue)
      const params = new URLSearchParams({
        action: 'track', iso: visit.isoTimestamp,
        page: visit.page, device: visit.device, sid: visit.sessionId,
        province: geo.province, city: geo.city, browser, os, ref: visit.referrer,
      });
      const sheetRes  = await fetch(`${SHEET_DOGET_URL}?${params}`, { redirect: 'follow' });
      const sheetText = await sheetRes.text().catch(() => '');
      if (sheetText.trim() !== 'ok') {
        console.warn('[track-visit] sheet response:', sheetRes.status, sheetText.slice(0, 150));
      }
    } catch (e) {
      console.error('[track-visit] async error:', e.message);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
//  EMAIL NOTIFICATION — nodemailer + Gmail SMTP
//  ต้องตั้ง env vars ใน Railway: GMAIL_USER, GMAIL_APP_PASSWORD
// ═══════════════════════════════════════════════════════════════════

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1Su-nW33_bmmE-RUDy0xVf7ppiee4g9RuuA5HcIgyN6E';
const NOTIFY_TO = process.env.NOTIFY_EMAIL || 'p2w.interplus@gmail.com';

function makeTransporter() {
  // strip spaces — Google แสดง App Password เป็น "xxxx xxxx xxxx xxxx" แต่ต้องไม่มี space
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass },
  });
}

// ── API: แจ้งเตือน Lead ใหม่ (เรียกหลัง form submit) ─────────────
app.post('/api/notify-lead', async (req, res) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.json({ success: false, reason: 'email not configured' });
  }
  const d = req.body || {};
  let subject = '', text = '';

  if (d.source === 'remap') {
    subject = '🔧 [Shiftup] ลูกค้าใหม่ขอประเมิน Remap!';
    text =
      `📋 ข้อมูลลูกค้าใหม่ — ECU Remap\n` +
      `─────────────────────────────────\n` +
      `⏰ เวลา      : ${new Date().toLocaleString('th-TH')}\n` +
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
      `⏰ เวลา      : ${new Date().toLocaleString('th-TH')}\n` +
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
    await makeTransporter().sendMail({
      from:    `"Shiftup Performance" <${process.env.GMAIL_USER}>`,
      to:      NOTIFY_TO,
      subject, text,
    });
    console.log(`[notify-lead] email sent: ${subject}`);
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
      visits:  allVisits,
      counts:  { ...data.counts, visits: allVisits.length },
    });
  } catch (err) {
    res.status(500).json({
      error: err.toString(),
      remapLeads: [], partnerApplications: [],
      visits,
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shiftup Performance server running on port ${PORT}`);
});
