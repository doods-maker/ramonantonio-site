// One-off: gera public/images/og-default.jpg (card de marca 1200x630).
// Rodar localmente: `node scripts/generate-og.mjs`. O JPG é commitado; CI não roda isto.
import sharp from 'sharp';

const W = 1200, H = 630;
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2d1e12"/>
      <stop offset="1" stop-color="#754d2a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="56" y="56" width="${W - 112}" height="${H - 112}" rx="18"
        fill="none" stroke="#c4a882" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${W / 2}" y="350" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700"
        fill="#f5e6cc">Ramon Antonio Advogados</text>
  <rect x="${W / 2 - 64}" y="388" width="128" height="4" rx="2" fill="#c4a882"/>
  <text x="${W / 2}" y="452" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="30" letter-spacing="2"
        fill="#c4a882">Especialistas em Direito Previdenciário</text>
  <text x="${W / 2}" y="512" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="22"
        fill="#ede0c8" fill-opacity="0.82">ramonantonio.adv.br</text>
</svg>`;

const logo = await sharp('public/images/logo.jpeg').resize({ height: 116 }).toBuffer();
const { width: lw } = await sharp(logo).metadata();

await sharp(Buffer.from(svg))
  .composite([{ input: logo, top: 132, left: Math.round((W - lw) / 2) }])
  .jpeg({ quality: 86 })
  .toFile('public/images/og-default.jpg');

console.log('OK: public/images/og-default.jpg');
