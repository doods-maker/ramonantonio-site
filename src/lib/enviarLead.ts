/**
 * Envio de leads do site institucional para o ramon-hub (CRM da banca).
 * Mesmo contrato do repo `ramonantonio-landing-pages` (src/lib/enviarLead.ts),
 * enxuto: sem quiz/triagem. Endpoint: POST /public/api/v1/ramon_leads
 * com o token no header X-Capture-Token (PUBLIC_LEADS_ENDPOINT no build).
 */
export interface LeadPayload {
  nome: string;
  telefone: string;
  /** Identifica a origem (vira `source` no CRM). Ex.: 'palestra'. */
  campanha: string;
  /** E-mail (opcional). */
  email?: string;
  /** Data de nascimento no formato ISO (YYYY-MM-DD), opcional. */
  dataNascimento?: string;
  /** Mensagem livre — vira nota automática no lead. */
  mensagem?: string;
  /** Honeypot anti-bot: deve vir vazio de humanos. */
  website?: string;
  /** Consentimento LGPD de marketing (opcional). */
  consent?: boolean;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
const UTM_STORAGE_KEY = 'ra_utm';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Lê utm_* da querystring e persiste em sessionStorage (atribuição sobrevive à navegação). */
export function capturarUtm(search?: string, storage?: StorageLike): Record<string, string> {
  try {
    const s = search ?? (typeof window === 'undefined' ? '' : window.location.search);
    const st = storage ?? (typeof sessionStorage === 'undefined' ? undefined : sessionStorage);
    const qs = new URLSearchParams(s);
    const daUrl: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = qs.get(k)?.trim();
      if (v) daUrl[k] = v.slice(0, 255);
    }
    if (Object.keys(daUrl).length > 0) {
      st?.setItem(UTM_STORAGE_KEY, JSON.stringify(daUrl));
      return daUrl;
    }
    return JSON.parse(st?.getItem(UTM_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * O token sai do path (vazava em log de proxy) e vai no header X-Capture-Token.
 * Aceita PUBLIC_LEADS_ENDPOINT com o token no fim da URL (.../ramon_leads/<token>).
 */
export function separarToken(endpoint: string): { url: string; token?: string } {
  const m = endpoint.match(/^(.+\/ramon_leads)\/([^/?#]+)\/?$/);
  return m ? { url: m[1], token: m[2] } : { url: endpoint };
}

/** Normaliza para E.164 brasileiro sem '+': '55' + DDD(2) + número(8 ou 9). */
export function normalizarTelefone(input: string): string | null {
  const digitos = (input ?? '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const comDDI = digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`;
  if (comDDI.length !== 12 && comDDI.length !== 13) return null;
  return comDDI;
}

/** Valida e-mail de forma permissiva (o servidor valida de novo). */
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email ?? '').trim());
}

/**
 * Valida data de nascimento ISO (YYYY-MM-DD): data real, no passado,
 * idade plausível (entre 5 e 120 anos).
 */
export function dataNascimentoValida(iso: string, hoje: Date = new Date()): boolean {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return false;
  const anoHoje = hoje.getUTCFullYear();
  if (y > anoHoje - 5 || y < anoHoje - 120) return false;
  return dt.getTime() < hoje.getTime();
}

export async function enviarLead(endpoint: string, payload: LeadPayload): Promise<{ ok: boolean }> {
  // Honeypot preenchido => bot. Finge sucesso e não envia.
  if (payload.website) return { ok: true };
  if (!payload.nome?.trim()) return { ok: false };
  const telefone = normalizarTelefone(payload.telefone);
  if (!telefone) return { ok: false };

  const { url, token } = separarToken(endpoint);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Capture-Token': token } : {}),
      },
      body: JSON.stringify({
        nome: payload.nome.trim(),
        telefone,
        campanha: payload.campanha,
        email: payload.email?.trim() || undefined,
        data_nascimento: payload.dataNascimento || undefined,
        mensagem: payload.mensagem?.trim() || undefined,
        ...(payload.consent ? { consent: true } : {}),
        ...capturarUtm(),
      }),
    });
    return { ok: resp.ok };
  } catch {
    return { ok: false };
  }
}
