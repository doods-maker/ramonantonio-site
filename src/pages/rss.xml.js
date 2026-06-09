import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site as info } from '../data/site.ts';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `Blog — ${info.nome}`,
    description: 'Artigos sobre direito previdenciário, INSS e seus direitos.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.id}/`,
    })),
    customData: `<language>pt-br</language>`,
  });
}
