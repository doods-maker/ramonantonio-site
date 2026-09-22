// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// Site institucional Ramon Antonio Advogados — saída estática para HostGator.
// Atualize `site` quando o domínio final estiver definido (ex.: https://ramonantonio.com.br)
export default defineConfig({
  site: 'https://ramonantonio.adv.br',
  trailingSlash: 'ignore',

  build: {
    // gera /blog/post/index.html -> URLs amigáveis no Apache do HostGator
    format: 'directory',
  },

  integrations: [
    sitemap({
      // /palestra/ é acessada só pelo QR code do evento — fora do sitemap (e noindex).
      filter: (page) => !page.includes('/palestra'),
      // LPs de captação vivem no repo landing-pages (deploy na subpasta /lp/),
      // mas o sitemap do domínio é gerado aqui — listar as LPs manualmente.
      customPages: [
        'https://ramonantonio.adv.br/lp/auxilio-acidente/',
        'https://ramonantonio.adv.br/lp/bpc-loas/',
        'https://ramonantonio.adv.br/lp/salario-maternidade/',
        'https://ramonantonio.adv.br/lp/trabalhista-geral/',
      ],
    }),
  ],
});