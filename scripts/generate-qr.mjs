// Gera o QR code da página da palestra (SVG + PNG) em public/images/palestra/.
// Uso: node scripts/generate-qr.mjs            → usa site + path de src/data/palestra.ts
//      node scripts/generate-qr.mjs <url>      → URL customizada (ex.: com utm_*)
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import QRCode from 'qrcode';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://ramonantonio.adv.br';
const url = process.argv[2] ?? `${SITE}/palestra/`;
const dir = path.join(raiz, 'public', 'images', 'palestra');
await mkdir(dir, { recursive: true });

// Alto contraste para leitura à distância (projetor/impresso): tinta escura da marca sobre branco.
const opts = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#191310', light: '#ffffff' } };

const svg = await QRCode.toString(url, { ...opts, type: 'svg' });
await writeFile(path.join(dir, 'qrcode.svg'), svg);
await QRCode.toFile(path.join(dir, 'qrcode.png'), url, { ...opts, width: 1600 });

console.log(`QR gerado para ${url}\n → public/images/palestra/qrcode.svg\n → public/images/palestra/qrcode.png (1600px)`);
