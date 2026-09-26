// ============================================================
//  server.js  —  本地开发服务器 + Gist API 代理
//  token 只存在于服务端 .env，前端永远拿不到
// ============================================================
require('dotenv').config({ override: true });
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
let GIST_ID = process.env.GIST_ID || '';

const GIST_API = 'https://api.github.com/gists';
const HEADERS = {
  'Accept': 'application/vnd.github+json',
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
  'User-Agent': 'math-practice-app'
};

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

// ---------- helpers ----------
async function githubFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: HEADERS });
  const body = await res.text();
  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
  return { ok: res.ok, status: res.status, data: parsed };
}

function readLocalData(filename) {
  try {
    const p = path.join(__dirname, 'data', filename);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

// ---------- API: read gist ----------
app.get('/api/gist', async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'no_token', message: '服务端未配置 GITHUB_TOKEN' });
  }
  if (!GIST_ID) {
    return res.status(404).json({ error: 'no_gist', message: '尚未创建 Gist，点击初始化' });
  }
  try {
    const { ok, status, data } = await githubFetch(`${GIST_API}/${GIST_ID}`);
    if (!ok) {
      if (status === 401 || status === 403) {
        return res.status(status).json({ error: 'invalid_token', message: 'GitHub Token 无效或已过期' });
      }
      if (status === 404) {
        return res.status(404).json({ error: 'gist_not_found', message: 'Gist 不存在或已被删除' });
      }
      return res.status(status).json({ error: 'github_error', message: `GitHub API 返回 ${status}` });
    }
    const files = {};
    for (const [name, f] of Object.entries(data.files || {})) {
      files[name] = f.content || '';
    }
    res.json({ ok: true, files, gistId: GIST_ID });
  } catch (e) {
    res.status(502).json({ error: 'network_error', message: '无法连接 GitHub API，请检查网络' });
  }
});

// ---------- API: write gist ----------
app.patch('/api/gist', async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'no_token', message: '服务端未配置 GITHUB_TOKEN' });
  }
  if (!GIST_ID) {
    return res.status(404).json({ error: 'no_gist', message: '尚未创建 Gist' });
  }
  const { files } = req.body || {};
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'bad_request', message: '缺少 files 参数' });
  }
  try {
    const { ok, status, data } = await githubFetch(`${GIST_API}/${GIST_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: '高中数学刷题本 — 题库与做题数据',
        files
      })
    });
    if (!ok) {
      if (status === 401 || status === 403) {
        return res.status(status).json({ error: 'invalid_token', message: 'GitHub Token 无效或无 gist 权限' });
      }
      return res.status(status).json({ error: 'github_error', message: `写入失败，GitHub 返回 ${status}` });
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'network_error', message: '无法连接 GitHub API' });
  }
});

// ---------- API: init / create gist ----------
app.post('/api/gist/init', async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'no_token', message: '服务端未配置 GITHUB_TOKEN' });
  }
  // If already exists, just return
  if (GIST_ID) {
    return res.json({ ok: true, gistId: GIST_ID, created: false });
  }
  const chapters = readLocalData('chapters.json') || [];
  const questions = readLocalData('questions.json') || [];
  try {
    const { ok, status, data } = await githubFetch(GIST_API, {
      method: 'POST',
      body: JSON.stringify({
        description: '高中数学刷题本 — 题库与做题数据',
        public: false,
        files: {
          'chapters.json': { content: JSON.stringify(chapters, null, 2) },
          'questions.json': { content: JSON.stringify(questions, null, 2) },
          'data.json': { content: JSON.stringify({ completed: {}, wrongs: {}, daily: {} }, null, 2) }
        }
      })
    });
    if (!ok) {
      if (status === 401 || status === 403) {
        return res.status(status).json({ error: 'invalid_token', message: 'Token 无效或缺少 gist 权限' });
      }
      return res.status(status).json({ error: 'github_error', message: `创建 Gist 失败，GitHub 返回 ${status}` });
    }
    GIST_ID = data.id;
    // Persist to .env
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    try { envContent = fs.readFileSync(envPath, 'utf-8'); } catch {}
    if (envContent.includes('GIST_ID=')) {
      envContent = envContent.replace(/GIST_ID=.*/, `GIST_ID=${GIST_ID}`);
    } else {
      envContent += `\nGIST_ID=${GIST_ID}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    res.json({ ok: true, gistId: GIST_ID, created: true });
  } catch (e) {
    res.status(502).json({ error: 'network_error', message: '无法连接 GitHub API' });
  }
});

// ---------- API: health check ----------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    tokenConfigured: !!GITHUB_TOKEN,
    gistConfigured: !!GIST_ID,
    gistId: GIST_ID ? GIST_ID.slice(0, 8) + '…' : null
  });
});

// SPA fallback — serve index.html for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not_found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  高中数学刷题本  →  http://localhost:${PORT}`);
  console.log(`  Token 已加载: ${GITHUB_TOKEN ? '是 (' + GITHUB_TOKEN.slice(0, 4) + '…' + GITHUB_TOKEN.slice(-4) + ')' : '否'}`);
  console.log(`  Gist ID: ${GIST_ID || '未设置（首次调用 /api/gist/init 自动创建）'}\n`);
});
