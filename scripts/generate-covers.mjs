// One-off: gera uma capa de marca 1200x630 por post em public/images/posts/<slug>.jpg
// a partir do título (e 1ª tag) do frontmatter. Rodar: `node scripts/generate-covers.mjs`.
// Outputs commitados; CI não roda isto.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const W = 1200, H = 630, DIR = 'src/content/blog';
mkdirSync('public/images/posts', { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(title, max) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

for (const f of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const slug = f.replace('.md', '');
  const fm = readFileSync(`${DIR}/${f}`, 'utf8').split('---')[1] || '';
  const title = (fm.match(/title:\s*"([^"]+)"/) || [])[1] || slug;
  const tag = (((fm.match(/tags:\s*\[([^\]]*)\]/) || [])[1] || '').split(',')[0] || '')
    .replace(/["']/g, '').trim();

  let lines = wrap(title, 28);
  if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] = lines[3].replace(/.$/, '…'); }
  const fz = lines.length > 3 ? 46 : 54;
  const startY = 250;
  const tspans = lines
    .map((l, i) => `<tspan x="80" y="${Math.round(startY + i * fz * 1.18)}">${esc(l)}</tspan>`)
    .join('');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d1e12"/><stop offset="1" stop-color="#5c3c1f"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="0" y="0" width="10" height="${H}" fill="#c4a882"/>
    <text x="80" y="92" font-family="Arial, sans-serif" font-size="22" font-weight="700"
          letter-spacing="3" fill="#c4a882">RAMON ANTONIO ADVOGADOS</text>
    <text font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${fz}"
          fill="#f5e6cc">${tspans}</text>
    <rect x="80" y="${H - 156}" width="90" height="4" rx="2" fill="#c4a882"/>
    ${tag ? `<text x="80" y="${H - 116}" font-family="Arial, sans-serif" font-size="20"
          font-weight="700" letter-spacing="2" fill="#c4a882">${esc(tag.toUpperCase())}</text>` : ''}
    <text x="80" y="${H - 56}" font-family="Arial, sans-serif" font-size="20"
          fill="#ede0c8" fill-opacity="0.82">ramonantonio.adv.br</text>
  </svg>`;

  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(`public/images/posts/${slug}.jpg`);
  console.log(`posts/${slug}.jpg  (${lines.length} linhas, fz=${fz})`);
}
