// ───────────────────────────────────────────────────────────────────────────
// FONTE ÚNICA DE DADOS DO ESCRITÓRIO
// Edite este arquivo para atualizar contato, áreas, equipe e depoimentos.
// Valores entre {{CHAVES}} são PLACEHOLDERS — substitua pelos dados reais.
// ───────────────────────────────────────────────────────────────────────────

export const site = {
  nome: 'Ramon Antonio Advogados',
  nomeCompleto: 'Ramon Antonio Advogados Associados',
  cnpj: '07.958.258/0001-44',
  oab: 'OAB/SC 1.107 (sociedade) • Ramon Antonio OAB/SC 19.044',
  slogan: 'Especialistas em Direito Previdenciário',
  // Frase de autoridade do hero
  destaque: '+23 anos de experiência e mais de 10.000 benefícios previdenciários conquistados.',
  anosExperiencia: 23,
  beneficios: '10.000',

  // ── Contato ───────────────────────────────────────────────────────────────
  telefone: '(48) 8855-4077',
  whatsapp: {
    // número apenas com dígitos e DDI 55 para o link wa.me
    numero: '554888554077',
    exibicao: '(48) 8855-4077',
    mensagem: 'Olá! Gostaria de falar com a equipe do Ramon Antonio Advogados.',
  },
  email: '{{EMAIL — a definir}}',
  horario: 'Segunda a sexta, das 8h às 18h',

  endereco: {
    logradouro: 'Rua Coronel Teixeira, 40',
    bairro: 'Centro',
    cidade: 'Tubarão',
    uf: 'SC',
    cep: '88701-230',
    mapsQuery: 'Rua Coronel Teixeira, 40, Centro, Tubarão - SC, 88701-230',
  },

  cidadesAtendidas: [
    'Tubarão', 'Braço do Norte', 'Criciúma', 'Içara', 'Imbituba', 'Laguna',
  ],

  redes: {
    instagram: 'https://www.instagram.com/ramonantonioadvogados/',
    instagramHandle: '@ramonantonioadvogados',
    facebook: 'https://www.facebook.com/ramonantonioadvogados/',
  },
} as const;

// ── Áreas de atuação ────────────────────────────────────────────────────────
export const areas = [
  {
    titulo: 'Direito Previdenciário',
    destaque: true,
    icone: 'shield',
    descricao:
      'Nossa especialidade. Aposentadorias, auxílios, pensões, revisões de benefícios e ações contra o INSS — com mais de duas décadas de atuação dedicada.',
    itens: [
      'Aposentadorias (idade, tempo de contribuição, especial, rural)',
      'Auxílio-doença e auxílio-acidente',
      'BPC/LOAS — Benefício de Prestação Continuada',
      'Pensão por morte',
      'Revisão e recálculo de benefícios',
      'Planejamento previdenciário',
    ],
  },
  {
    titulo: 'Direito Civil',
    icone: 'scale',
    descricao:
      'Contratos, responsabilidade civil, questões de família e sucessões com atendimento próximo e personalizado.',
    itens: ['Contratos', 'Responsabilidade civil', 'Família e sucessões'],
  },
  {
    titulo: 'Direito do Trabalho',
    icone: 'briefcase',
    descricao:
      'Defesa dos direitos do trabalhador em rescisões, verbas e reconhecimento de vínculo.',
    itens: ['Rescisões e verbas', 'Reconhecimento de vínculo', 'Reclamatórias trabalhistas'],
  },
  {
    titulo: 'Direito Administrativo',
    icone: 'building',
    descricao:
      'Atuação junto a órgãos públicos, servidores e processos administrativos.',
    itens: ['Servidores públicos', 'Processos administrativos'],
  },
] as const;

// ── Equipe (placeholders de foto até o usuário enviar) ──────────────────────
export const equipe = [
  { nome: 'Ramon Antonio', funcao: 'Sócio fundador • OAB/SC 19.044', foto: '/images/ramon.jpg' },
  { nome: 'Crisleine Antonio', funcao: 'Advogada especialista', foto: '/images/crisleine.jpg' },
  { nome: 'Brenda', funcao: 'Advogada especialista', foto: '/images/brenda.PNG' },
  { nome: 'Rafaela', funcao: 'Advogada especialista', foto: '/images/rafaela.jpg' },
  { nome: 'Tamires', funcao: 'Advogada especialista', foto: '/images/tamires.jpg' },
  { nome: 'Eduardo Schlata', funcao: 'Advogado especialista • OAB/SC 39.859', foto: '/images/eduardo.jpg' },
] as const;

// ── Depoimentos (substitua por depoimentos reais autorizados) ───────────────
export const depoimentos = [
  {
    texto:
      'Consegui minha aposentadoria depois de anos de tentativas. A equipe cuidou de tudo com atenção e me manteve informado em cada etapa.',
    autor: '{{Cliente — Tubarão/SC}}',
  },
  {
    texto:
      'Profissionais sérios e que realmente entendem de previdenciário. Recomendo a todos que precisam resolver com o INSS.',
    autor: '{{Cliente — Laguna/SC}}',
  },
  {
    texto:
      'Atendimento humano e técnico ao mesmo tempo. Tive meu benefício revisado e o valor corrigido.',
    autor: '{{Cliente — Criciúma/SC}}',
  },
] as const;

// Helpers
export const waLink = `https://wa.me/${site.whatsapp.numero}?text=${encodeURIComponent(site.whatsapp.mensagem)}`;
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.endereco.mapsQuery)}`;
