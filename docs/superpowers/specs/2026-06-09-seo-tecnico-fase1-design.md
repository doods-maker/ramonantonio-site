# SEO Técnico — Fase 1 (quick wins)

**Data:** 2026-06-09
**Repo:** doods-maker/ramonantonio-site (site Astro estático, deploy FTP HostGator via GitHub Actions na `main`)
**Status:** Aprovado para planejamento (writing-plans)

## Objetivo

Ganhos de ranking e de compartilhamento **sem reescrever conteúdo dos posts**. Tudo em
código, com commits atômicos e verificação no build e no servidor ao vivo. Reescrita de
conteúdo, breadcrumbs, RSS e OG dinâmico por post ficam para a Fase 2.

## Contexto da auditoria (estado atual)

Já bom: sitemap + robots corretos, `title`/`description` únicos por página, canonical,
Open Graph/Twitter, JSON-LD `LegalService`, URLs limpas, HTML semântico, boa mira de
palavra-chave nos posts (auxílio-acidente, BPC/LOAS, fibromialgia, hérnia de disco).

Lacunas que esta fase resolve:
- `image` padrão aponta para `/images/og-default.jpg`, que **não existe** → prévia de
  compartilhamento quebrada (home + todos os posts, que não definem `image`).
- Posts sem dados estruturados de artigo (só `LegalService` global).
- `og:type` sempre `website`, mesmo em artigos.
- Sem links internos entre posts ou para seções de serviço.
- Fotos da equipe pesadas (~4MB no total; brenda.PNG 1.5MB, eduardo.jpg 1.3MB).

## Escopo — 5 entregas

### 1. Imagem OG de marca (1200×630)
- Card estático: fundo bronze/cream + logo + "Ramon Antonio Advogados" + slogan
  "Especialistas em Direito Previdenciário".
- Gerado por script Node **one-off** `scripts/generate-og.mjs` usando `sharp`
  (devDependency). Compõe um SVG de fundo+texto e sobrepõe `public/images/logo.jpeg`.
  Saída: `public/images/og-default.jpg` (qualidade ~85).
- **O output é commitado**; o script roda só localmente. **CI não roda o script** —
  portanto `sharp` não é dependência de build/CI.
- Risco conhecido: fontes Cormorant/Inter podem não existir no renderizador SVG do
  sharp (resvg). Mitigação: embutir a fonte via base64 no SVG ou cair para fallback
  serif/sans web-safe. Aceitável para OG.
- `Base.astro` continua usando `image` com default `/images/og-default.jpg` (agora
  existente). Dimensões `og:image:width/height` = 1200/630.

### 2. Dados estruturados: `BlogPosting` + `FAQPage`
- `LegalService` passa a ser emitido **só na home** (`Base.astro` ganha prop para
  controlar, ou a home injeta seu próprio bloco).
- Em `src/pages/blog/[...slug].astro`, injetar `<script type="application/ld+json">` com
  `BlogPosting`: `headline`, `description`, `datePublished` (pubDate), `dateModified`
  (pubDate por ora), `author` (`Person`/`Organization`), `image` (a do post ou a OG
  default absoluta), `publisher` (Organization + logo), `mainEntityOfPage`.
- `FAQPage`: derivar Q&A dos `## ` do corpo do post que forem perguntas (terminam em
  "?" ou começam com quem/quando/como/o que/é possível). Resposta = prosa até o próximo
  heading, com markdown removido. **Se o post não tiver H2s em forma de pergunta, emitir
  só `BlogPosting`** (não inventar FAQ). Fonte do corpo: `post.body` (markdown cru).
- Todas as URLs em `@id`/`url`/`image` devem ser **absolutas** (usar `Astro.site`).

### 3. Open Graph de artigo
- `Base.astro` aceita props opcionais: `type` (default `'website'`), `publishedTime`,
  `author`. Quando `type='article'`: emitir `og:type=article`,
  `article:published_time`, `article:author`.
- Adicionar `og:site_name` (= `site.nome`) em todas as páginas.
- O template de post passa `type="article"` + `publishedTime`/`author`.

### 4. Links internos
- **Posts relacionados** ao fim de cada post: até 3 outros posts com ≥1 `tag` em comum
  (fallback: mais recentes). Bloco "Leia também" com links `/blog/<id>`.
- **Link contextual** para a home: na aside de CTA do post, adicionar link para
  "Áreas de atuação" (`/#areas`) além do WhatsApp. (Mapa tag→seção fica para a Fase 2;
  por ora link genérico para `/#areas`.)

### 5. Otimização de imagens
- Script Node one-off `scripts/optimize-images.mjs` (`sharp`): para as fotos da equipe
  em `public/images/`, redimensionar para largura máx. ~700px e recomprimir.
- PNGs de foto (brenda.PNG, crisleine.png) convertidos para WebP/JPG otimizado; demais
  recomprimidos. **Atualizar os caminhos correspondentes em `src/data/site.ts`** quando a
  extensão mudar; remover os originais grandes. `thais.webp` e `logo.jpeg` (12KB) ficam.
- Outputs commitados; script roda só localmente (não no CI).

## Arquivos afetados
- `package.json` — `sharp` como devDependency (uso local; não entra no build CI).
- `scripts/generate-og.mjs` (novo, one-off).
- `scripts/optimize-images.mjs` (novo, one-off).
- `public/images/og-default.jpg` (novo, commitado).
- `public/images/*` (fotos otimizadas/convertidas).
- `src/layouts/Base.astro` — props `type`/`publishedTime`/`author`, `og:site_name`,
  `og:image:width/height`, controle do `LegalService`.
- `src/pages/blog/[...slug].astro` — JSON-LD `BlogPosting`+`FAQPage`, OG de artigo,
  posts relacionados, link `/#areas`.
- `src/pages/index.astro` (se o `LegalService` migrar para a home).
- `src/data/site.ts` — caminhos de foto, se extensões mudarem.

## Fora de escopo (Fase 2)
Reescrita/ampliação do conteúdo dos posts (800–1500 palavras), breadcrumbs + schema,
RSS feed, OG dinâmico por post, `dateModified` real por histórico de edição,
mapa tag→seção para links contextuais.

## Verificação
- `npm run build` conclui sem erros; 7 páginas.
- JSON-LD válido no HTML gerado: `BlogPosting` presente em cada post; `FAQPage` presente
  onde aplicável; `LegalService` só na home. (Conferir estrutura e URLs absolutas.)
- `og:image` resolve **200** ao vivo; `og:type=article` nos posts; `og:site_name` em todas.
- Tamanho das fotos reduzido (somatório bem abaixo dos ~4MB atuais); imagens ainda
  renderizam corretamente na home.
- Deploy na `main` → workflow "Deploy para HostGator" = success → verificação no servidor
  (mesmo método das etapas anteriores: buscar artefatos servidos e validar).

## Fluxo de trabalho
Spec (este doc) → `writing-plans` (superpowers) → execução com **commits atômicos**
(ou `/gsd-quick` por item). **Não** tocar no `.planning/` (roadmap do projeto
arquiteto-liderhub, que coabita este repo).
