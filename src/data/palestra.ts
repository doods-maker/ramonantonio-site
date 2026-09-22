// ───────────────────────────────────────────────────────────────────────────
// PÁGINA DA PALESTRA — /palestra/  (QR code projetado/impresso no evento)
// Edite aqui título, textos e o identificador da campanha. O QR code em
// public/images/palestra/ é gerado por `node scripts/generate-qr.mjs`.
// ───────────────────────────────────────────────────────────────────────────

export const palestra = {
  /** Caminho da página (o QR aponta para site + path). */
  path: '/palestra/',

  /** Vira `source` do lead no CRM (ramon-hub). Troque por evento, ex.: 'palestra-2026-10-sindicato'. */
  campanha: 'palestra',

  eyebrow: 'Palestra',
  titulo: 'Fique por dentro dos seus direitos',
  subtitulo:
    'Deixe seus dados e receba o material da palestra e orientações do escritório sobre benefícios do INSS.',

  /** Rótulo do botão de envio. */
  botao: 'Quero receber o material',

  /** Mensagem exibida após o envio (o {nome} vira o primeiro nome da pessoa). */
  sucessoTitulo: 'Obrigado, {nome}!',
  sucessoTexto:
    'Recebemos seus dados. Em breve nossa equipe entra em contato pelo WhatsApp com o material da palestra.',

  /** Texto do consentimento opcional (LGPD). */
  consentimento:
    'Autorizo o escritório a me enviar orientações e novidades sobre meus direitos pelo WhatsApp e e-mail. Opcional — posso revogar quando quiser.',
} as const;
