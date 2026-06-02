import { defineCollection, z } from 'astro:content';

// Coleção do blog. Cada post é um arquivo .md em src/content/blog/.
// Um agente de IA pode publicar criando um novo .md com este frontmatter.
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Ramon Antonio Advogados'),
    image: z.string().optional(),       // caminho em /public, ex.: /images/posts/abc.jpg
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),  // true = não publicado no build
  }),
});

export const collections = { blog };
