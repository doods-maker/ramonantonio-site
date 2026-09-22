// Gera os QR codes da palestra em public/images/palestra/:
//   qrcode.svg / qrcode.png            → endereço curto do site (/palestra → redireciona ao formulário)
//   qrcode-formulario.png              → link direto do formulário do Google (reserva, caso o site esteja fora)
// Uso: node scripts/generate-qr.mjs
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import QRCode from 'qrcode';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://ramonantonio.adv.br';

// Lê path e formUrl de src/data/palestra.ts (fonte única) sem precisar de TypeScript.
const dados = await readFile(path.join(raiz, 'src', 'data', 'palestra.ts'), 'utf8');
const pegar = (chave) => dados.match(new RegExp(`${chave}:\\s*'([^']+)'`))?.[1];
const urlCurta = `${SITE}${pegar('path') ?? '/palestra'}`;
const urlForm = pegar('formUrl');
if (!urlForm) throw new Error('formUrl não encontrado em src/data/palestra.ts');

const dir = path.join(raiz, 'public', 'images', 'palestra');
await mkdir(dir, { recursive: true });

// Alto contraste para leitura à distância (projetor/impresso): tinta escura da marca sobre branco.
const opts = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#191310', light: '#ffffff' } };

await writeFile(path.join(dir, 'qrcode.svg'), await QRCode.toString(urlCurta, { ...opts, type: 'svg' }));
await QRCode.toFile(path.join(dir, 'qrcode.png'), urlCurta, { ...opts, width: 1600 });
await QRCode.toFile(path.join(dir, 'qrcode-formulario.png'), urlForm, { ...opts, width: 1600 });

console.log(`QR principal → ${urlCurta}\n → public/images/palestra/qrcode.svg + qrcode.png (1600px)`);
console.log(`QR reserva   → ${urlForm}\n → public/images/palestra/qrcode-formulario.png`);
