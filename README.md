# Ramon Antonio Advogados — Website

Site institucional estático em **Astro** para o escritório **Ramon Antonio Advogados
Associados** (Tubarão/SC), especializado em Direito Previdenciário. Saída 100%
estática, pronta para hospedagem no **HostGator**.

## Comandos

```bash
npm install      # instala dependências (uma vez)
npm run dev      # servidor local em http://localhost:4321
npm run build    # gera o site estático em dist/
npm run preview  # pré-visualiza o build de dist/
```

## Onde editar o conteúdo

| O quê | Arquivo |
|------|---------|
| Contato, áreas, equipe, depoimentos, redes | `src/data/site.ts` |
| Paleta de cores e tipografia | `src/styles/global.css` (`:root`) |
| Seções da home | `src/pages/index.astro` |
| Posts do blog | `src/content/blog/*.md` |
| Widget do feed do Instagram | `src/components/InstagramFeed.astro` |

### Placeholders a preencher
Os valores entre `{{...}}` em `src/data/site.ts` são placeholders — substitua por:
telefone/WhatsApp reais (`whatsapp.numero` com DDI 55), e-mail, nº OAB, CEP e horário.
Logo: troque o bloco `.brand__mark` em `src/components/Header.astro` por
`<img src="/images/logo.svg">`. Fotos da equipe: coloque em `public/images/` e
informe o caminho no campo `foto` de cada membro em `src/data/site.ts`.

## Publicando um novo post (fluxo para agentes de IA)

1. Crie um arquivo `src/content/blog/meu-novo-post.md` com este frontmatter:

   ```markdown
   ---
   title: "Título do artigo"
   description: "Resumo curto para SEO e cards."
   pubDate: 2026-06-02
   author: "Ramon Antonio Advogados"
   tags: ["previdenciário", "INSS"]
   draft: false
   ---

   Conteúdo em Markdown...
   ```

2. Rode `npm run build`.
3. Suba o conteúdo de `dist/` para o HostGator (veja abaixo).

O slug da URL vem do nome do arquivo. Use `draft: true` para deixar um rascunho fora
do build. Imagens de capa: salve em `public/images/posts/` e referencie em `image:`.

## Feed do Instagram

O Instagram não permite ler o feed sem API/token. Para incorporar o feed real de
`@ramonantonioadvogados`, gere um embed gratuito em **LightWidget**, **Elfsight** ou
**SnapWidget**, conecte a conta e cole o `<script>/<iframe>` no ponto indicado em
`src/components/InstagramFeed.astro` (removendo o placeholder).

## Deploy no HostGator

1. `npm run build`.
2. No cPanel → **Gerenciador de Arquivos** (ou via FTP), envie **todo o conteúdo de
   `dist/`** para `public_html/` (inclua o `.htaccess`).
3. Pronto. Para atualizar, repita: build → subir `dist/`.

> Dica: nas configurações do FTP/Gerenciador, certifique-se de que arquivos ocultos
> (como `.htaccess`) estão visíveis ao enviar.

## Configuração do domínio

Ajuste `site:` em `astro.config.mjs` para o domínio final (afeta canonical, Open
Graph e sitemap).
