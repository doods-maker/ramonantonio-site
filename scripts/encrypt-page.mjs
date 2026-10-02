// Gera uma página protegida por senha a partir de um HTML qualquer.
// O HTML original é cifrado (AES-256-GCM, chave PBKDF2-SHA256) e só o texto
// cifrado vai pro repositório (que é PÚBLICO) — sem a senha, ninguém lê.
//
// Uso:  PAGE_PASSWORD='senha' node scripts/encrypt-page.mjs <entrada.html> <saida.html> [título]
// Ex.:  PAGE_PASSWORD='...' node scripts/encrypt-page.mjs "~/Downloads/Manual de POPs (interativo).html" public/equipe/pops/index.html "Manual de POPs"
//
// ponytail: senha única compartilhada pelo time; trocar = rodar de novo com outra senha e publicar.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const [input, output, title = 'Área do time'] = process.argv.slice(2);
const password = process.env.PAGE_PASSWORD;
if (!input || !output || !password) {
  console.error('Uso: PAGE_PASSWORD=... node scripts/encrypt-page.mjs <entrada.html> <saida.html> [título]');
  process.exit(1);
}

const ITER = 600000;
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, ITER, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
// WebCrypto espera o tag de autenticação colado no fim do texto cifrado.
const data = Buffer.concat([cipher.update(readFileSync(input)), cipher.final(), cipher.getAuthTag()]);
const b64 = (b) => b.toString('base64');

const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title} — Ramon Antonio Advogados</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100vh; display: grid; place-items: center; padding: 16px;
         background: #191310; color: #ede0c8; font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  form { width: 100%; max-width: 360px; display: grid; gap: 14px; text-align: center; }
  .mono { font: 600 56px/1 Georgia, serif; letter-spacing: .02em; }
  .bar { width: 48px; height: 3px; background: #c4a882; margin: 0 auto 8px; }
  h1 { font: 500 22px/1.3 Georgia, serif; }
  p { color: rgba(237,224,200,.6); font-size: 14px; }
  input, button { width: 100%; padding: 12px 14px; border-radius: 10px; font: inherit; }
  input { border: 1px solid rgba(237,224,200,.25); background: #231810; color: inherit; }
  input:focus { outline: 2px solid #c4a882; outline-offset: 1px; }
  button { border: 0; background: #754d2a; color: #ede0c8; font-weight: 600; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
  #erro { color: #e8a08a; min-height: 1.5em; }
</style>
</head>
<body>
<form id="f">
  <div class="mono" aria-hidden="true">RA</div>
  <div class="bar"></div>
  <h1>${title}</h1>
  <p>Acesso restrito à equipe Ramon Antonio Advogados.</p>
  <label for="s" style="position:absolute;left:-9999px">Senha</label>
  <input id="s" type="password" placeholder="Senha" autocomplete="current-password" required autofocus>
  <button id="b">Entrar</button>
  <div id="erro" role="alert"></div>
</form>
<script>
const SALT = '${b64(salt)}', IV = '${b64(iv)}', ITER = ${ITER};
const DATA = '${b64(data)}';
const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
document.getElementById('f').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('b'), erro = document.getElementById('erro');
  btn.disabled = true; btn.textContent = 'Abrindo…'; erro.textContent = '';
  try {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(document.getElementById('s').value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(SALT), iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(IV) }, key, bytes(DATA)));
    const t = document.title;
    document.open(); document.write(html); document.close();
    if (!document.title) document.title = t;
  } catch {
    erro.textContent = 'Senha incorreta.';
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});
</script>
</body>
</html>
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, page);
console.log(`OK → ${output} (${(page.length / 1024).toFixed(0)} KB)`);
