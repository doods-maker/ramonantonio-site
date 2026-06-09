# SEO Técnico Fase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar SEO técnico (OG image, JSON-LD BlogPosting+FAQPage, OG de artigo, links internos) e ampliar o conteúdo dos 5 posts do blog, sem otimização de imagens (Fase 2).

**Architecture:** Site Astro estático. Mudanças em `Base.astro` (meta/JSON-LD), no template de post (`[...slug].astro`), nos 5 markdowns do blog, e um script Node one-off para gerar a imagem OG. Sem framework de testes — a verificação é `npm run build` + asserções com Node sobre o HTML gerado em `dist/`, e checagem no servidor após deploy.

**Tech Stack:** Astro 6, `@astrojs/sitemap`, `sharp` (devDependency, uso local), Node 22, deploy FTP via GitHub Actions na `main`.

**Verificação (padrão deste projeto):** não há test runner. Cada task termina com `npm run build` e um one-liner Node que faz `assert` sobre `dist/`. Falha do assert = `process.exit(1)`.

---

### Task 1: Imagem OG de marca (1200×630)

**Files:**
- Modify: `package.json` (devDependency `sharp`)
- Create: `scripts/generate-og.mjs`
- Create (gerado): `public/images/og-default.jpg`

- [ ] **Step 1: Instalar sharp como devDependency**

Run: `npm install -D sharp`
Expected: `sharp` aparece em `devDependencies` no `package.json`; build CI não usa (script é one-off local).

- [ ] **Step 2: Criar o script de geração**

Create `scripts/generate-og.mjs`:

```js
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
```

- [ ] **Step 3: Gerar a imagem e verificar dimensões**

Run:
```
node scripts/generate-og.mjs
node -e "const s=require('sharp');s('public/images/og-default.jpg').metadata().then(m=>{const ok=m.width===1200&&m.height===630;console.log(m.format,m.width+'x'+m.height);process.exit(ok?0:1)})"
```
Expected: `jpeg 1200x630` e exit 0. (Se o nome ficar ilegível por falta de fonte, ajustar `font-family` para fontes presentes no Windows — Georgia/Arial existem.)

- [ ] **Step 4: Commit**

```
git add package.json package-lock.json scripts/generate-og.mjs public/images/og-default.jpg
git commit -m "feat(seo): imagem OG de marca 1200x630 + script gerador"
```

---

### Task 2: `Base.astro` — OG de artigo, site_name, dimensões, LegalService só na home

**Files:**
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Adicionar props e computados no frontmatter**

Em `src/layouts/Base.astro`, alterar a interface `Props` e o destructuring para incluir `type`, `publishedTime`, `author`. Adicionar computados após `canonical`:

```ts
interface Props {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
}

const {
  title = `${site.nome} — ${site.slogan}`,
  description = `${site.nomeCompleto} em ${site.endereco.cidade}/${site.endereco.uf}. ${site.destaque}`,
  image = '/images/og-default.jpg',
  type = 'website',
  publishedTime,
  author,
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site).href;
const ogImage = new URL(image, Astro.site).href;
const isHome = Astro.url.pathname === '/';
```

(Se `isHome` já existir, não duplicar.)

- [ ] **Step 2: Atualizar as meta tags OG no `<head>`**

Substituir o bloco Open Graph atual por:

```astro
    <meta property="og:type" content={type} />
    <meta property="og:site_name" content={site.nome} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="pt_BR" />
    {type === 'article' && publishedTime && (
      <meta property="article:published_time" content={publishedTime} />
    )}
    {type === 'article' && author && <meta property="article:author" content={author} />}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImage} />
```

- [ ] **Step 3: Restringir o JSON-LD `LegalService` à home**

Trocar a linha do JSON-LD para só renderizar quando `isHome`:

```astro
    {isHome && <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />}
```

- [ ] **Step 4: Build e verificar**

Run:
```
npm run build
node -e "const fs=require('fs');const home=fs.readFileSync('dist/index.html','utf8');const post=fs.readFileSync('dist/blog/auxilio-acidente-quem-tem-direito/index.html','utf8');const a=home.includes('og:site_name')&&home.includes('content=\"https://ramonantonio.adv.br/images/og-default.jpg\"')&&home.includes('LegalService');const b=!post.includes('LegalService');console.log('home og+ld:',a,'| post sem LegalService:',b);process.exit(a&&b?0:1)"
```
Expected: `home og+ld: true | post sem LegalService: true`, exit 0.

- [ ] **Step 5: Commit**

```
git add src/layouts/Base.astro
git commit -m "feat(seo): OG de artigo, og:site_name, og:image absoluta; LegalService so na home"
```

---

### Task 3: Template do post — BlogPosting + FAQPage + OG article + relacionados + link interno

**Files:**
- Modify: `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Computar relacionados, FAQ e JSON-LD no frontmatter**

Em `src/pages/blog/[...slug].astro`, dentro do frontmatter (após obter `post` e `Content`), adicionar:

```ts
// Posts relacionados (>=1 tag em comum; fallback: mais recentes), no máx. 3
const all = (await getCollection('blog', ({ data }) => !data.draft))
  .filter((p) => p.id !== post.id);
const related = all
  .map((p) => ({ p, score: p.data.tags.filter((t) => post.data.tags.includes(t)).length }))
  .sort((a, b) => b.score - a.score || b.p.data.pubDate.valueOf() - a.p.data.pubDate.valueOf())
  .slice(0, 3)
  .map((x) => x.p);

// FAQ derivado dos H2 do corpo que são perguntas
const QUESTION_RE = /\?\s*$/;
const START_RE = /^(o que|quem|quando|como|qual|quais|por que|é possível|preciso|posso)\b/i;
const lines = post.body.split('\n');
const faq: { q: string; a: string }[] = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^##\s+(.*)$/);
  if (!m) continue;
  const q = m[1].trim();
  if (!(QUESTION_RE.test(q) || START_RE.test(q))) continue;
  const buf: string[] = [];
  for (let j = i + 1; j < lines.length && !/^#{1,6}\s/.test(lines[j]); j++) buf.push(lines[j]);
  const a = buf.join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // links markdown -> texto
    .replace(/[*_`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (a.length > 40) faq.push({ q: q.endsWith('?') ? q : q + '?', a });
}

const abs = (p: string) => new URL(p, Astro.site).href;
const blogPosting = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.pubDate.toISOString(),
  dateModified: post.data.pubDate.toISOString(),
  author: { '@type': 'Organization', name: post.data.author },
  image: abs(post.data.image ?? '/images/og-default.jpg'),
  publisher: {
    '@type': 'Organization',
    name: 'Ramon Antonio Advogados',
    logo: { '@type': 'ImageObject', url: abs('/images/logo.jpeg') },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': abs(`/blog/${post.id}/`) },
};
const faqPage = faq.length
  ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }
  : null;
```

- [ ] **Step 2: Passar props de artigo para o Base e injetar o JSON-LD**

Trocar a tag de abertura do `<Base ...>` e adicionar os scripts logo após:

```astro
<Base
  title={`${post.data.title} — Blog`}
  description={post.data.description}
  image={post.data.image}
  type="article"
  publishedTime={post.data.pubDate.toISOString()}
  author={post.data.author}
>
  <script type="application/ld+json" set:html={JSON.stringify(blogPosting)} />
  {faqPage && <script type="application/ld+json" set:html={JSON.stringify(faqPage)} />}
```

(O `image={post.data.image}` pode ser `undefined`; o Base já cai no default OG.)

- [ ] **Step 3: Renderizar relacionados + link interno na aside de CTA**

Substituir a `<aside class="post__cta">` por:

```astro
      {related.length > 0 && (
        <section class="post__related">
          <h2>Leia também</h2>
          <ul>
            {related.map((r) => (
              <li><a href={`/blog/${r.id}`}>{r.data.title}</a></li>
            ))}
          </ul>
        </section>
      )}

      <aside class="post__cta">
        <h3>Precisa de ajuda com o seu caso?</h3>
        <p>Nossa equipe analisa o seu histórico e indica o melhor caminho.</p>
        <a href={waLink} class="btn btn--primary" target="_blank" rel="noopener">Falar no WhatsApp</a>
        <a href="/#areas" class="post__cta-link">Ver áreas de atuação →</a>
      </aside>
```

- [ ] **Step 4: Adicionar estilos dos novos blocos**

No `<style>` do arquivo, acrescentar:

```css
  .post__related { margin-top: 3rem; border-top: 1px solid var(--cream-dk); padding-top: 1.6rem; }
  .post__related h2 { font-size: 1.3rem; margin-bottom: .9rem; }
  .post__related ul { display: grid; gap: .6rem; }
  .post__related a { font-weight: 600; }
  .post__cta-link { display: inline-block; margin-top: .9rem; color: var(--bronze-pl); font-weight: 600; font-size: .92rem; }
```

- [ ] **Step 5: Build e verificar JSON-LD e OG de artigo**

Run:
```
npm run build
node -e "const fs=require('fs');const h=fs.readFileSync('dist/blog/auxilio-acidente-quem-tem-direito/index.html','utf8');const bp=h.includes('\"@type\":\"BlogPosting\"');const og=h.includes('property=\"og:type\" content=\"article\"');const rel=h.includes('Leia também')||h.includes('Leia tamb');console.log('BlogPosting:',bp,'| og article:',og,'| relacionados:',rel);process.exit(bp&&og?0:1)"
```
Expected: `BlogPosting: true | og article: true | relacionados: true`, exit 0. (FAQPage só aparece após a Task 4 dar H2s de pergunta a cada post; aqui pode estar ausente.)

- [ ] **Step 6: Commit**

```
git add "src/pages/blog/[...slug].astro"
git commit -m "feat(seo): JSON-LD BlogPosting+FAQPage, OG article, posts relacionados e link interno"
```

---

### Task 4: Ampliar o conteúdo dos 5 posts (700–1000 palavras, H2 de pergunta)

**Files:**
- Modify: `src/content/blog/aposentadoria-por-tempo-de-contribuicao.md`
- Modify: `src/content/blog/auxilio-acidente-quem-tem-direito.md`
- Modify: `src/content/blog/bpc-loas-quem-tem-direito.md`
- Modify: `src/content/blog/fibromialgia-direitos-no-inss.md`
- Modify: `src/content/blog/hernia-de-disco-beneficio-inss.md`
- Create: `docs/superpowers/validacao-juridica-blog.md`

**Regras para todos:** preservar o frontmatter (title, description, pubDate, author, tags, draft). Ler o corpo atual primeiro e preservar afirmações já corretas. Manter exatamente **um** conteúdo por arquivo, com H2 (`## `) em forma de pergunta (alimentam o FAQPage). Não inventar prazos/valores/percentuais incertos — toda afirmação numérica específica vai para a nota de validação. Linguagem clara, acessível, tom do escritório. Encerrar com 1–2 frases de CTA leve (sem repetir o bloco de CTA do template).

- [ ] **Step 1: Reescrever `aposentadoria-por-tempo-de-contribuicao.md`**

Estrutura (H2 = perguntas):
- `## O que é a aposentadoria por tempo de contribuição?`
- `## Ela ainda existe após a Reforma da Previdência?`
- `## Quais são as regras de transição?` (citar as regras de transição de forma geral; números específicos → validação)
- `## Quem tem direito hoje?`
- `## Quais documentos preciso reunir?`
- `## Como o advogado ajuda a garantir o melhor benefício?`

Alvo: 700–1000 palavras. Build não é necessário ainda.

- [ ] **Step 2: Reescrever `auxilio-acidente-quem-tem-direito.md`**

Estrutura:
- `## O que é o auxílio-acidente?`
- `## Quem tem direito ao auxílio-acidente?`
- `## Qual é o valor do auxílio-acidente?` (percentual → validação)
- `## É possível acumular com salário ou outro benefício?`
- `## Quais documentos comprovam o direito?`
- `## Como solicitar?`

- [ ] **Step 3: Reescrever `bpc-loas-quem-tem-direito.md`**

Estrutura:
- `## O que é o BPC/LOAS?`
- `## Quem tem direito ao BPC?`
- `## Qual é a renda máxima para receber o BPC?` (critério de renda per capita → validação)
- `## Quais documentos são necessários?`
- `## Como solicitar o BPC/LOAS?`

- [ ] **Step 4: Reescrever `fibromialgia-direitos-no-inss.md`**

Estrutura:
- `## A fibromialgia dá direito a benefício do INSS?`
- `## Quais benefícios são possíveis?`
- `## Como comprovar a fibromialgia na perícia?`
- `## O que fazer se o benefício for negado?`

- [ ] **Step 5: Reescrever `hernia-de-disco-beneficio-inss.md`**

Estrutura:
- `## Hérnia de disco dá direito a benefício do INSS?`
- `## Quais benefícios a hérnia de disco pode garantir?`
- `## Como comprovar a incapacidade?`
- `## E se o INSS negar o pedido?`

- [ ] **Step 6: Criar a nota de validação jurídica**

Create `docs/superpowers/validacao-juridica-blog.md` listando, por post, as afirmações específicas a confirmar (ex.: percentual do auxílio-acidente, critério de renda do BPC, regras/idades de transição da aposentadoria, exigências de perícia). Cada item: afirmação + onde aparece + "confirmar".

- [ ] **Step 7: Build e verificar estrutura/contagem**

Run:
```
npm run build
node -e "const fs=require('fs');const g=require('child_process');let ok=true;for(const f of fs.readdirSync('src/content/blog')){const t=fs.readFileSync('src/content/blog/'+f,'utf8');const body=t.split('---').slice(2).join('---');const words=body.trim().split(/\s+/).length;const q=(body.match(/^##\s+.*\?/gm)||[]).length;const pass=words>=600&&q>=3;if(!pass)ok=false;console.log(f,'palavras='+words,'perguntas='+q,pass?'OK':'FALHOU');}process.exit(ok?0:1)"
```
Expected: cada post com `palavras>=600` e `perguntas>=3`, exit 0.

- [ ] **Step 8: Verificar que o FAQPage agora aparece**

Run:
```
node -e "const fs=require('fs');let n=0;for(const d of fs.readdirSync('dist/blog')){const p='dist/blog/'+d+'/index.html';if(!fs.existsSync(p))continue;if(fs.readFileSync(p,'utf8').includes('\"@type\":\"FAQPage\"'))n++;}console.log('posts com FAQPage:',n);process.exit(n>=4?0:1)"
```
Expected: `posts com FAQPage: 5` (ou ≥4), exit 0.

- [ ] **Step 9: Commit (um por post + a nota)**

```
git add src/content/blog docs/superpowers/validacao-juridica-blog.md
git commit -m "content(blog): amplia os 5 posts (700-1000 palavras, H2 de pergunta p/ FAQ) + nota de validacao juridica"
```

---

### Task 5: Deploy e verificação ao vivo

**Files:** nenhum (deploy + checagem)

- [ ] **Step 1: Push para a main (dispara o deploy)**

```
git push origin main
```

- [ ] **Step 2: Aguardar o workflow**

```
gh run list --branch main --limit 1 --json databaseId,status,conclusion -q '.[0]'
```
Expected: `conclusion: success` (esperar se `in_progress`).

- [ ] **Step 3: Verificar no servidor ao vivo**

```
node -e "(async()=>{const base='https://ramonantonio.adv.br';const og=await fetch(base+'/images/og-default.jpg');const post=await (await fetch(base+'/blog/auxilio-acidente-quem-tem-direito/')).text();const okOg=og.status===200&&/image\/jpeg/.test(og.headers.get('content-type')||'');const okBp=post.includes('\"@type\":\"BlogPosting\"');const okFaq=post.includes('\"@type\":\"FAQPage\"');const okArt=post.includes('og:type')&&post.includes('article');console.log('og 200:',okOg,'| BlogPosting:',okBp,'| FAQPage:',okFaq,'| og article:',okArt);process.exit(okOg&&okBp&&okArt?0:1)})()"
```
Expected: todos `true`, exit 0.

- [ ] **Step 4: Validar o JSON-LD (manual, opcional)**

Conferir 1 post no Rich Results Test do Google (`search.google.com/test/rich-results`) para `Article` e `FAQ`. (Manual — fora do CI.)

---

## Self-Review

**Spec coverage:**
- Imagem OG (spec §1) → Task 1 ✓
- BlogPosting + FAQPage (spec §2) → Task 3 (schema) + Task 4 (H2 de pergunta que alimentam o FAQ) ✓
- LegalService só na home (spec §2) → Task 2 Step 3 ✓
- OG de artigo + og:site_name (spec §3) → Task 2 ✓
- Links internos (spec §4) → Task 3 Steps 3–4 ✓
- Conteúdo dos posts (spec §5) → Task 4 ✓
- Nota de validação jurídica (spec §5) → Task 4 Step 6 ✓
- Verificação (spec) → cada task + Task 5 ✓
- Fora de escopo (imagens/CWV, breadcrumbs, RSS, capas) → não há tasks ✓

**Placeholder scan:** sem TBD/TODO; código completo nas tasks técnicas; Task 4 usa outlines concretos (H2 fixos) + regra anti-invenção — apropriado para conteúdo. Sem passos vagos.

**Type consistency:** `type`/`publishedTime`/`author` definidos na Task 2 e usados na Task 3; `blogPosting`/`faqPage`/`related`/`faq` definidos e usados no mesmo arquivo (Task 3); seletores `.post__related`/`.post__cta-link` definidos e usados na Task 3.
