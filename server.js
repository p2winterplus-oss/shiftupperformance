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

// ── Proxy GET → Google Apps Script (หลีกเลี่ยง CORS) ────────────────────────
app.get('/api/get-leads', async (req, res) => {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbxGc0JZJkZ0MtW73_MldOdcc-ILttkvcA5G_16-0MwhjrLtWLSFTlQrMdD3W-g-dmqIDg/exec';
  try {
    const r    = await fetch(scriptUrl, { redirect: 'follow' });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString(), remapLeads: [], partnerApplications: [], counts: { remap: 0, partner: 0 } });
  }
});

// ── Save content → commit to GitHub ──────────────────────────────────────────
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

    // 1. ดึงไฟล์ปัจจุบันจาก GitHub เพื่อเอา SHA และ content
    const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers });
    let current = {};
    let sha = null;
    if (getRes.ok) {
      const file = await getRes.json();
      sha = file.sha;
      current = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
    }

    // 2. อัปเดต section ที่แก้ไข
    current[section] = data;

    // 3. Commit กลับไป GitHub
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
