import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', '.github', 'node_modules', 'scripts']);
const required = [
  'index.html','about.html','news.html','exhibit.html','gallery.html','photo.html','records.html',
  'roster.html','broadcast.html','mail.html','revision.html','restore.html','log.html',
  'letter.html','sitemap.html','404.html','styles.css',
  'assets/photo-group-1993.jpg','assets/tape.svg','assets/roster.svg'
];
const forbidden = [
  '<button', 'data-answer', 'data-record', 'echoArchiveProgress', 'localStorage',
  '你的判斷', '需要提示', '清除進度', '推理成立', '答對', '答錯',
  '第一關', '第二關', '關卡', '遊戲進度',
  '以下素材均為本作品原創虛構內容', '顯示檢查：', '可驗證的網站資產',
  '不再使用拼貼圖切片', '不會再受錯誤 JPEG'
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`缺少必要檔案：${file}`);
}

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (entry.name.startsWith('.') || ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

const files = walk(root);
const deployedTextFiles = files.filter(f => /\.(html|css|js|json|xml|txt)$/i.test(f));
for (const file of deployedTextFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (text.includes(token)) failures.push(`${path.relative(root,file)} 含禁止內容：${token}`);
  }
}

const htmlFiles = files.filter(f => f.endsWith('.html'));
const attr = /(?:href|src)=["']([^"']+)["']/g;
for (const file of htmlFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(attr)) {
    const raw = match[1];
    if (/^(?:https?:|mailto:|tel:|#|data:)/i.test(raw)) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(file), clean);
    if (!target.startsWith(root) || !fs.existsSync(target)) {
      failures.push(`${path.relative(root,file)} 引用不存在：${raw}`);
    }
  }
}

for (const svgName of ['tape.svg','roster.svg']) {
  const svgPath = path.join(root, 'assets', svgName);
  if (fs.existsSync(svgPath)) {
    const svg = fs.readFileSync(svgPath, 'utf8');
    if (!svg.trimStart().startsWith('<svg')) failures.push(`assets/${svgName} 不是有效 SVG 文字檔`);
  }
}

const groupPhoto = path.join(root, 'assets', 'photo-group-1993.jpg');
if (fs.existsSync(groupPhoto)) {
  const head = fs.readFileSync(groupPhoto).subarray(0, 3);
  if (!(head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)) {
    failures.push('assets/photo-group-1993.jpg 不是有效 JPEG');
  }
}

if (fs.existsSync(path.join(root, 'app.js'))) failures.push('舊版 app.js 仍存在');
if (fs.existsSync(path.join(root, 'data'))) failures.push('舊版 data 目錄仍存在');

if (failures.length) {
  console.error('Echo Archive v2 發布檢查失敗：');
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log(`Echo Archive v2 發布檢查通過：${htmlFiles.length} 個 HTML 頁面、所有連結與必要美術資產有效，未發現遊戲 UI 或製作註解。`);