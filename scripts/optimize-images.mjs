// One-off: otimiza as fotos da equipe (resize + recompressão; PNG pesado -> WebP).
// Rodar localmente: `node scripts/optimize-images.mjs`. Outputs commitados; CI não roda isto.
// Lê cada arquivo para um buffer ANTES de escrever (sharp não lê e grava o mesmo path).
import sharp from 'sharp';
import { readFileSync, writeFileSync, unlinkSync, statSync } from 'node:fs';

const MAXW = 700;
const jobs = [
  { src: 'public/images/brenda.PNG',    out: 'public/images/brenda.webp',    fmt: 'webp', del: true },
  { src: 'public/images/crisleine.png', out: 'public/images/crisleine.webp', fmt: 'webp', del: true },
  { src: 'public/images/eduardo.jpg',   out: 'public/images/eduardo.jpg',    fmt: 'jpeg' },
  { src: 'public/images/ramon.jpg',     out: 'public/images/ramon.jpg',      fmt: 'jpeg' },
  { src: 'public/images/rafaela.jpg',   out: 'public/images/rafaela.jpg',    fmt: 'jpeg' },
  { src: 'public/images/tamires.jpg',   out: 'public/images/tamires.jpg',    fmt: 'jpeg' },
  { src: 'public/images/thais.webp',    out: 'public/images/thais.webp',     fmt: 'webp' },
];

const kb = (n) => (n / 1024).toFixed(0) + 'KB';
let before = 0, after = 0;

for (const j of jobs) {
  before += statSync(j.src).size;
  let img = sharp(readFileSync(j.src)).rotate().resize({ width: MAXW, withoutEnlargement: true });
  img = j.fmt === 'webp' ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true });
  const buf = await img.toBuffer();
  writeFileSync(j.out, buf);
  if (j.del && j.out !== j.src) unlinkSync(j.src);
  after += buf.length;
  console.log(`${j.src} -> ${j.out}  ${kb(statSync(j.out).size)}`);
}

console.log(`\nTOTAL: ${kb(before)} -> ${kb(after)}`);
