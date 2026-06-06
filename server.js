import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Serve the Vite build output
app.use(express.static(join(__dirname, 'dist')));

// ── Visit Tracking — เก็บใน server memory + sync GitHub ทุก 30 นาที ──────────
// ไม่พึ่ง Apps Script → ไม่มี CORS / redirect issues เลย

let visits = [];
let visitsDirty = false;

function ghHeaders() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

function visitsGhUrl() {
  const o = process.env.GITHUB_OWNER;
  const r = process.env.GITHUB_REPO;
  const b = process.env.GITHUB_BRANCH || 'main';
  return { url: `https://api.github.com/repos/${o}/${r}/contents/public/visits.json`, branch: b };
}

// โหลดประวัติ visits จาก GitHub ตอน server start
async function loadVisits() {
  try {
    const { url, branch } = visitsGhUrl();
    const res = await fetch(`${url}?ref=${branch}`, { headers: ghHeaders() });
    if (res.ok) {
      const file = await res.json();
      const historical = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
      // prepend historical data — preserve any visits that arrived before load completes
      visits = [...historical, ...visits];
      console.log(`[visits] loaded ${historical.length} historical visits from GitHub`);
    } else {
      console.log('[visits] no visits.json yet — starting fresh');
    }
  } catch (err) {
    console.log('[visits] load error (starting fresh):', err.message);
  }
}

// บันทึก visits กลับไป GitHub
async function saveVisits() {
  if (!visitsDirty || visits.length === 0) return;
  visitsDirty = false;
  try {
    const { url, branch } = visitsGhUrl();
    const headers = ghHeaders();

    // ดึง SHA ของไฟล์เดิม
    const getRes = await fetch(`${url}?ref=${branch}`, { headers });
    let sha = null;
    if (getRes.ok) sha = (await getRes.json()).sha;

    // เก็บแค่ 10,000 visits ล่าสุด
    const toSave = visits.length > 10000 ? visits.slice(-10000) : [...visits];

    const body = {
      message: `analytics: sync visits (${toSave.length} total)`,
      content: Buffer.from(JSON.stringify(toSave)).toString('base64'),
      branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (putRes.ok) {
      visits = toSave;
      console.log(`[visits] saved ${toSave.length} visits to GitHub`);
    } else {
      visitsDirty = true; // retry next interval
      const errBody = await putRes.json().catch(() => ({}));
      console.error('[visits] save failed:', errBody.message || putRes.status);
    }
  } catch (err) {
    visitsDirty = true;
    console.error('[visits] save error:', err.toString());
  }
}

// โหลดตอน server เริ่ม
loadVisits();

// Sync ไป GitHub ทุก 30 นาที
setInterval(saveVisits, 30 * 60 * 1000);

// ── API: บันทึก visit (รับจาก browser, same-origin — ไม่มี CORS) ───────────
app.post('/api/track-visit', (req, res) => {
  const { page, device, sessionId, isoTimestamp, timestamp } = req.body || {};
  visits.push({
    isoTimestamp: isoTimestamp || new Date().toISOString(),
    timestamp:    timestamp    || new Date().toLocaleString('th-TH'),
    page:         page         || 'home',
    device:       device       || 'desktop',
    sessionId:    sessionId    || Math.random().toString(36).slice(2),
  });
  visitsDirty = true;
  res.json({ success: true, total: visits.length });
});

// ── API: ดึง leads (Apps Script) + visits (server memory) ───────────────────
app.get('/api/get-leads', async (req, res) => {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec';
  try {
    const r    = await fetch(scriptUrl, { redirect: 'follow' });
    const data = await r.json();
    // Merge: leads จาก Apps Script + visits จาก server memory
    res.json({
      ...data,
      visits,
      counts: { ...data.counts, visits: visits.length },
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

// ── API: Save content → commit to GitHub ─────────────────────────────────────
app.post('/api/save-content', async (req, res) => {
  try {
    const { section, data } = req.body;
    const token  = process.env.GITHUB_TOKEN;
    const owner  = process.env.GITHUB_OWNER;
    const repo   = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const filePath = 'public/content.json';
    const apiBase  = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const headers  = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
    let current = {};
    let sha = null;
    if (getRes.ok) {
      const file = await getRes.json();
      sha = file.sha;
      current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    }

    current[section] = data;

    const body = {
      message: `content: update ${section} via admin panel`,
      content: Buffer.from(JSON.stringify(current, null, 2)).toString('base64'),
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

// SPA fallback — all routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shiftup Performance server running on port ${PORT}`);
});
