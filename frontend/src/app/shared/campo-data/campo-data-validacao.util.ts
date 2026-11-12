import { dataCompleta, parseDataEstrita } from './campo-data-mascara.util';

/** Data civil local (sem horário) a partir de Date do Material ou ISO. */
export function normalizarDataLocal(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function dataAceita(data: Date, nascimento: boolean): boolean {
  if (Number.isNaN(data.getTime())) return false;
  if (!nascimento) return true;
  const fimDoDia = new Date();
  fimDoDia.setHours(23, 59, 59, 999);
  return data.getTime() <= fimDoDia.getTime();
}

/** @deprecated Use resolverDataCommit em dateChange. Mantido para testes legados de picker vazio. */
export function resolverData(bruto: string, picker: Date | null | undefined): Date | null {
  const r = resolverDataCommit(bruto, picker);
  return r === 'limpar' || r === 'invalida' ? null : r;
}

export type ResolucaoDataCommit = Date | 'limpar' | 'invalida';

/**
 * Fechamento (dateChange): texto dd/mm/aaaa válido prevalece; calendário via `picker` se o
 * texto estiver vazio ou incompleto; texto completo e inválido (ex. 31/02) = inválido;
 * não usa picker com digitação parcial (evita 01/01/2001).
 */
export function resolverDataCommit(
  bruto: string,
  picker: Date | null | undefined
): ResolucaoDataCommit {
  const t = bruto.trim();
  if (!t && !picker) return 'limpar';

  const fromTexto = parseDataEstrita(t);
  if (fromTexto) return fromTexto;

  if (dataCompleta(t)) return 'invalida';

  if (!t && picker instanceof Date && !Number.isNaN(picker.getTime())) {
    return normalizarDataLocal(picker);
  }

  if (!t) return 'limpar';
  return 'invalida';
}

export type AvaliacaoTextoData =
  | { incompleta: true }
  | { incompleta: false; valida: boolean; data: Date | null };

export function avaliarTextoData(texto: string, nascimento: boolean): AvaliacaoTextoData {
  const t = texto.trim();
  if (!t || !dataCompleta(t)) return { incompleta: true };
  const data = parseDataEstrita(t);
  if (!data) return { incompleta: false, valida: false, data: null };
  const valida = dataAceita(data, nascimento);
  return { incompleta: false, valida, data: valida ? data : null };
}
