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

  integrations: [sitemap()],
});