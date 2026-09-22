/**
 * Envia uma inscrição (formulário /palestra/) para a planilha Google no Drive,
 * por meio do Apps Script publicado como Web App (scripts/apps-script/inscricoes-palestra.gs).
 *
 * A requisição é um "simple request" de propósito (corpo text/plain, sem headers
 * extras): o Apps Script responde com redirect e CORS liberado só nesse formato.
 */
export interface InscricaoPayload {
  nome: string;
  /** ISO YYYY-MM-DD. */
  dataNascimento: string;
  email: string;
  /** E.164 sem '+', ex.: 5548988554077. */
  telefone: string;
  campanha: string;
  consent: boolean;
  /** Honeypot anti-bot: deve vir vazio de humanos. */
  website?: string;
  utm?: Record<string, string>;
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY'. */
export function formatarDataBr(iso: string): string {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** '5548988554077' → '+55 (48) 98855-4077' (texto, para a planilha não virar número). */
export function formatarTelefoneBr(e164: string): string {
  const d = e164.replace(/\D/g, '');
  const local = d.slice(2);
  const ddd = local.slice(0, 2);
  const num = local.slice(2);
  const meio = num.length === 9 ? `${num.slice(0, 5)}-${num.slice(5)}` : `${num.slice(0, 4)}-${num.slice(4)}`;
  return `+55 (${ddd}) ${meio}`;
}

export async function enviarInscricao(endpoint: string, p: InscricaoPayload): Promise<{ ok: boolean }> {
  if (p.website) return { ok: true }; // bot: finge sucesso
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        nome: p.nome.trim(),
        data_nascimento: formatarDataBr(p.dataNascimento),
        email: p.email.trim(),
        telefone: formatarTelefoneBr(p.telefone),
        consent: p.consent ? 'Sim' : 'Não',
        campanha: p.campanha,
        utm: p.utm && Object.keys(p.utm).length ? JSON.stringify(p.utm) : '',
        website: p.website ?? '',
      }),
    });
    if (!resp.ok) return { ok: false };
    try {
      const json = await resp.json();
      return { ok: json?.ok !== false };
    } catch {
      return { ok: true };
    }
  } catch {
    return { ok: false };
  }
}
