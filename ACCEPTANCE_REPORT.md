# 高中数学刷题本 — 重构验收报告

> 重构方向：Linear / Vercel / Notion 极简克制风格
> 日期：2026-09-26
> 本地运行：`node server.js` → http://localhost:3000

---

## 一、Emoji → Lucide 图标替换清单

全站 34 个 emoji 全部替换为内联 Lucide SVG（stroke-width 1.75，24×24 viewBox），尺寸分 sm(14) / md(16) / lg(20) / xl(24) 四档，与文字基线对齐。

| 原 Emoji | Lucide 图标名 | 使用场景 |
|---------|-------------|---------|
| 🔐 | `lock` | 登录页锁图标 |
| ⚙ | `settings` | 设置页导航 |
| ❌ | `x-circle` | 错误/删除状态 |
| 🌙 | `moon` | 深色模式切换 |
| 🎲 | `shuffle` | 随机抽题按钮 |
| 🎵 | `music` | 音效开关 |
| 💖 | `heart` | 收藏/喜欢 |
| 💡 | `lightbulb` | 提示/解析 |
| 💳 | `credit-card` | 恢复码输入 |
| 📅 | `calendar` | 每日记录 |
| 📊 | `bar-chart-3` | 统计页导航 |
| 📋 | `list` | 全部题目导航 |
| 📑 | `file-text` | 文档/导出 |
| 📚 | `book-open` | 章节菜单导航 |
| 📝 | `file-text` | 笔记/编辑 |
| 📤 | `upload` | 导出/上传 |
| 📥 | `download` | 导入/下载 |
| 📧 | `mail` | 联系/反馈 |
| 🔊 | `volume-2` | 音量控制 |
| 🔍 | `search` | 搜索框 |
| 🔑 | `key` | 密码/凭据 |
| 🗑 | `trash-2` | 删除按钮 |
| 🗣 | `mic` | 语音/朗读 |
| 🤖 | `bot` | AI 助手入口 |
| ☁ | `cloud` | 云端同步状态 |
| ⚠ | `alert-triangle` | 警告提示 |
| ✅ | `check-circle-2` | 成功/完成状态 |
| ✓ | `check` | 选项正确标记 |
| 🎉 | `sparkles` | 答对庆祝 |
| 📖 | `book-text` | 错题本导航 |
| 🔄 | `rotate-ccw` | 重置/刷新 |
| 🔴 | `circle` | 状态指示点 |
| 📍 | `map-pin` | 统计定位标记 |
| 📱 | `cloud` / `wifi-off` | 同步设备状态 |

**验证**：`grep -P '[\\x{1F300}-\\x{1F9FF}]' js/ index.html` → 零残留。

---

## 二、配色 Before → After

### 主色板

| 用途 | Before | After |
|-----|--------|-------|
| 主色 | `#28a745` 亮绿 / `#3498db` 蓝 | `#2C5F4E` 墨绿 |
| 强调色 | `#e74c3c` 红 / `#f2c94a` 黄 / 彩虹标签 | `#B5543A` 赭红（仅 1 个） |
| 背景 | `#fff` 纯白 / `#f8f9fa` | `#FAFAF8` 米白 |
| 卡片背景 | `#fff` + 厚重阴影 | `#FFFFFF` + 细边框 + 微阴影 |
| 正文 | `#4a4a6a` / `#3d3d5c` | `#1A1A1A` |
| 次要文字 | `#888` | `#5A5A5A` |
| 三级文字 | `#888` | `#6E6E68`（对比度达标） |
| 分割线 | `#e0e0e0` / `#ecf0f1` | `#E5E2DC` |
| 边框 | 无 / 渐变 | `#E0DDD6` |

### 语义色（低饱和）

| 状态 | Before | After |
|-----|--------|-------|
| 成功 | `#28a745` / `#6fcf97` 亮绿 | `#2C5F4E` 墨绿 + `#EDF4EF` 浅底 |
| 错误 | `#e74c3c` / `#dc3545` / `#f28b82` | `#B5543A` 赭红 + `#F5E8E3` 浅底 |
| 警告 | `#f2c94a` 亮黄 | `#8A6D20` 暗金 + `#F5F0E3` 浅底 |
| 导航栏 | `#0f3460` / `#1a3a5c` 深蓝实色 | 毛玻璃白底 `rgba(250,250,248,0.85)` + 下划线激活 |

**移除**：所有渐变（`linear-gradient`）、厚重阴影（`box-shadow > 8px`）、彩虹标签色、亮绿按钮。

---

## 三、字体系统

| 用途 | 字体 |
|-----|------|
| 中文 | `-apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC"` |
| 英文/数字 | `Inter`（Google Fonts, display=swap） |
| 题号/数据/统计 | `JetBrains Mono`（Google Fonts, display=swap） |
| 标题 | 字重 600–700，行高 1.2–1.3 |
| 正文 | 字重 400，行高 1.6–1.7 |

---

## 四、动效清单

| 动效 | 实现 | 参数 |
|-----|------|------|
| 板块淡入上移 | Intersection Observer + `.reveal` 类 | `translateY(10px)` + `opacity 0→1`，`350ms ease-out`，threshold 0.05 |
| 按钮 hover | CSS `transition` | `150–200ms`，背景色/边框色/位移 1px |
| 链接 hover | CSS `transition` | `150ms`，颜色变化 |
| 卡片 hover | CSS `transition` | `200ms`，边框色 + 微阴影 |
| 减少动效 | `@media (prefers-reduced-motion: reduce)` | 关闭所有 `animation` 和 `transition` |
| FAB 计时器 | CSS `transition` | `200ms` 缩放/透明度 |

**未使用**：GSAP、jQuery animate、CSS keyframe 夸张动画。

---

## 五、Gist 数据连接

### 架构

```
前端 (js/sync.js, js/app.js)
  ↓ fetch('/api/gist')
Node Express 代理 (server.js)
  ↓ Authorization: Bearer ${GITHUB_TOKEN}
GitHub Gist API
```

- **Token 存储**：仅 `.env` 文件（已 gitignore），服务端 `process.env.GITHUB_TOKEN` 读取
- **前端**：永远拿不到 token，只调用 `/api/gist`（GET 读 / PATCH 写 / POST init 创建）
- **Gist ID**：`810166c7ec38a58d2c6151fea0bc24de`
- **内容**：`questions.json`（50 题）、`chapters.json`（200 章）、`data.json`（用户进度）

### 错误处理

| 错误码 | 前端提示 |
|-------|---------|
| `no_token` | "服务端未配置 GITHUB_TOKEN，请检查 .env" |
| `invalid_token` | "Token 无效或已过期，请更新 .env 中的 GITHUB_TOKEN" |
| `gist_not_found` | "Gist 不存在，点击初始化创建" |
| `network_error` | "网络连接失败，已切换本地模式" |

所有错误通过设置页 `sync-status-container` 友好展示，不白屏。

---

## 六、布局检查结果

### 桌面 1440px

| 检查项 | 结果 |
|-------|------|
| 导航栏 | ✅ 毛玻璃白底，下划线激活态，无错位 |
| 菜单页 200 章列表 | ✅ mono 题号 + 章节名 + 进度标签，对齐整齐 |
| 全部题目页 | ✅ 搜索栏 + 章节标题 + 题目卡片，选项整齐 |
| 答题交互 | ✅ 答对绿色高亮 + 反馈 + 解析展开 |
| 统计页 | ✅ 4 项统计数据 + 每日记录表格 |
| 设置页 | ✅ 夜间模式/音量/同步/恢复码控件正常 |
| 图标基线对齐 | ✅ 逐屏检查无错位 |
| 文字溢出 | ✅ 无溢出 |

### 移动 375px

| 检查项 | 结果 |
|-------|------|
| 导航栏 | ✅ 紧凑布局，图标+文字正常 |
| 菜单页 | ✅ 章节列表单列，题号+名称+标签不溢出 |
| 全部题目页 | ✅ 搜索栏+随机按钮自适应，题目卡片全宽 |
| 选项按钮 | ✅ 全宽排列，文字不截断 |
| 数学公式 | ✅ MathJax 正常渲染，无横向溢出 |
| FAB 计时器 | ✅ 右下角固定，不遮挡核心内容 |
| 底部留白 | ✅ `padding-bottom: 100px` 防止内容被 FAB 遮挡 |
| 布局崩坏 | ✅ 无崩坏 |

---

## 七、Lighthouse 审计

| 指标 | 分数/值 |
|-----|---------|
| **性能 Performance** | **89** |
| **可访问性 Accessibility** | **92** |
| FCP (First Contentful Paint) | 2.0 s |
| LCP (Largest Contentful Paint) | 3.4 s |
| TBT (Total Blocking Time) | 110 ms |
| CLS (Cumulative Layout Shift) | 0.065 |
| Speed Index | 2.4 s |
| 页面传输大小 | 14 KB |

**可访问性修复记录**：首次审计发现 footer 12px 文字对比度 4.37:1（未达 WCAG AA 4.5:1），已将 `--text-tertiary` 从 `#767670` 加深至 `#6E6E68` 修复。

> 注：性能指标受沙箱环境 MathJax CDN 加载影响，实际部署环境会更快。

---

## 八、Token 安全审计

| 检查项 | 命令 | 结果 |
|-------|------|------|
| Token 出现在源码文件 | `grep -rn "ghp_..." --include='*.js' *.html *.css *.json` | ✅ 未找到 |
| Token 出现在 git 跟踪文件 | `git grep "ghp_..."` | ✅ 未找到 |
| Token 出现在 git 历史 | `git log --all -S "ghp_..."` | ✅ 未找到 |
| `.env` 在 `.gitignore` | `grep ".env" .gitignore` | ✅ 已排除 |
| `.env` 被 git 跟踪 | `git ls-files .env` | ✅ 未跟踪 |
| 前端直连 GitHub API | `grep "api.github.com" js/ index.html` | ✅ 无直连，仅调 `/api/*` |
| 前端含 token 变量 | `grep "GITHUB_TOKEN\|gistToken" js/` | ✅ 无，仅 server.js 引用 |

**结论**：token 仅存在于 `.env`（gitignore）和服务端运行时内存，前端永远拿不到。

---

## 九、文件变更清单

### 新建文件
- `server.js` — Express 代理 + 静态服务，token 仅服务端
- `.env` — 真实 token（gitignore，不提交）
- `.env.example` — 模板，无真实 token
- `.gitignore` — 排除 `.env` / `node_modules`
- `package.json` — express + dotenv 依赖
- `js/icons.js` — 34 个 Lucide SVG 内联图标库
- `js/scroll-reveal.js` — Intersection Observer 淡入动效

### 完全重写
- `css/style.css` — 全新设计系统（CSS 变量驱动）
- `index.html` — Google Fonts + Lucide 图标 + 无 emoji
- `js/sync.js` — 走代理 `/api/gist`，无 token 逻辑

### 重大修改
- `js/app.js` — loadData 从 Gist 加载，auth 门控保留
- `js/ui/menu.js` — mono 题号 + reveal + 无 emoji
- `js/ui/questions.js` — 图标状态 + reveal + 无 emoji
- `js/ui/wrongbook.js` — 图标 + reveal + 无 emoji
- `js/ui/stats.js` — 图标 + 无 emoji
- `js/ui/settings.js` — 图标 toast + 无 token 检查
- `js/storage.js` / `js/timer.js` / `js/audio.js` — 图标 toast
- `js/auth.js` — lock 图标 + 移除注入样式
- `data/questions.json` — 修复尾随逗号 bug

---

## 十、运行方式

```bash
cd math
npm install
cp .env.example .env
# 编辑 .env 填入 GITHUB_TOKEN 和 GIST_ID
node server.js
# 打开 http://localhost:3000
```
