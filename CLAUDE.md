# Ramon Antonio Advogados — Website

Site institucional **estático** do escritório **Ramon Antonio Advogados Associados**
(Tubarão/SC), especializado em Direito Previdenciário. Construído em **Astro**, com
saída 100% estática hospedada no **HostGator** (Apache). Inclui home institucional e
um **blog** em Markdown com SEO (sitemap, RSS, Open Graph, breadcrumbs).

## Stack

- **Astro 6** (`astro.config.mjs`) — saída estática, `build.format: 'directory'`
  (gera `/blog/post/index.html` para URLs amigáveis no Apache).
- **@astrojs/sitemap** + **@astrojs/rss** — SEO/feed.
- **sharp** — otimização de imagens (usado pelos scripts).
- `site:` em `astro.config.mjs` = `https://ramonantonio.adv.br` (afeta canonical, OG e sitemap).

## Comandos

```bash
npm install      # instala dependências (uma vez)
npm run dev      # servidor local em http://localhost:4321
npm run build    # gera o site estático em dist/
npm run preview  # pré-visualiza o build de dist/
```

Scripts auxiliares em `scripts/` (rodar com `node scripts/<arquivo>`):
- `optimize-images.mjs` — otimiza/converte imagens (ex.: PNG→WebP).
- `generate-covers.mjs` — gera capas de marca por post.
- `generate-og.mjs` — gera imagens Open Graph.

## Onde editar o conteúdo

| O quê | Arquivo |
|------|---------|
| Contato, áreas, equipe, depoimentos, redes | `src/data/site.ts` |
| Paleta de cores e tipografia | `src/styles/global.css` (`:root`) |
| Seções da home | `src/pages/index.astro` |
| Posts do blog | `src/content/blog/*.md` |
| Layouts | `src/layouts/` |
| Componentes | `src/components/` |

## Publicar um post no blog

1. Criar `src/content/blog/meu-post.md` com frontmatter:
   ```markdown
   ---
   title: "Título do artigo"
   description: "Resumo curto para SEO e cards."
   pubDate: 2026-06-02
   author: "Ramon Antonio Advogados"
   tags: ["previdenciário", "INSS"]
   draft: false
   ---
   ```
2. O **slug da URL vem do nome do arquivo**. `draft: true` deixa fora do build.
3. Imagens de capa: `public/images/posts/`, referenciar em `image:`.
4. `npm run build` e publicar (deploy abaixo).

## Palestra — QR code de captação (`/palestra`)

QR code projetado/impresso na palestra: a pessoa escaneia, cai no **formulário do Google**
e deixa os dados para o escritório retornar. As respostas caem na planilha do Drive
(gerenciada pelo Google Forms, fora deste repo).

| O quê | Onde |
|---|---|
| Link do formulário, endereço curto e textos | `src/data/palestra.ts` |
| Redirect `/palestra` → formulário (302) | `public/.htaccess` (manter igual ao `formUrl`) |
| Página com o QR para projetar/baixar/imprimir (`/palestra/qrcode/`, noindex) | `src/pages/palestra/qrcode.astro` |
| Arquivos do QR (PNG p/ slides, SVG p/ impressão, PNG reserva com link direto) | `public/images/palestra/` — regenerar com `node scripts/generate-qr.mjs` |

O QR aponta para `ramonantonio.adv.br/palestra` (curto, escaneia melhor de longe); para trocar
o formulário basta atualizar `formUrl` e o `.htaccess` — o QR impresso continua valendo.

## Deploy

Automático via **GitHub Actions** (`.github/workflows/deploy.yml`): a cada `push` na
branch **main** (ou "Run workflow" manual), o CI roda `npm ci` → `npm run build` →
envia `dist/` por **FTP** para o HostGator (`SamKirkland/FTP-Deploy-Action`).

- Secrets necessários no repo: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
- Protocolo: **FTP** (não FTPS) — usar FTPS quebra o deploy neste servidor.
- Destino: raiz da conta FTP (docroot do domínio). Incluir arquivos ocultos como `.htaccess`.

Deploy manual alternativo: `npm run build` e subir **todo o conteúdo de `dist/`** para
`public_html/` via cPanel/FTP.

## Convenções

- **Idioma:** todo o conteúdo do site é em **português (pt-BR)**.
- **Saída estática:** sem backend/SSR — nada de APIs em runtime; tudo gerado no build.
- **Não commitar `dist/`** — é artefato de build (o CI regenera).
- Placeholders `{{...}}` em `src/data/site.ts` devem ser substituídos por dados reais
  (WhatsApp com DDI 55, e-mail, OAB, CEP, horário) antes de ir pro ar.
