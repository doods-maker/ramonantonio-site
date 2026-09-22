// ───────────────────────────────────────────────────────────────────────────
// PALESTRA — QR code de captação de contatos (empresários)
// A pessoa escaneia o QR, cai no formulário do Google e o escritório retorna depois.
// O QR aponta para o endereço curto do site (path abaixo), que redireciona ao
// formulário via public/.htaccess — assim dá pra trocar o formulário sem reimprimir.
// Regenerar o QR: `node scripts/generate-qr.mjs`.
// ───────────────────────────────────────────────────────────────────────────

export const palestra = {
  /** Endereço curto no site (o QR aponta para site + path). */
  path: '/palestra',

  /** Formulário do Google que recebe os dados (respostas caem na planilha do Drive). */
  formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdKNU8XpnTYVvs6jwBm3K_lKPseU1fZLL0nTunnl5MeiNG4Dw/viewform',

  eyebrow: 'Palestra',
  titulo: 'Aponte a câmera do celular',
  subtitulo: 'Deixe seus dados no formulário e a equipe do escritório entra em contato com você.',
} as const;
