/** Normaliza para #RRGGBB em maiúsculas quando válido; caso contrário retorna null. */
export function parseCorHex(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`;
  return null;
}

export function corHexValida(v: string | null | undefined): boolean {
  return parseCorHex(v) !== null;
}

export function corHexComPadrao(v: string | null | undefined, padrao: string): string {
  return parseCorHex(v) ?? parseCorHex(padrao) ?? '#0E7490';
}
