/** Validação alinhada a DocumentoValidator.cs (RN-Gerais 14/15). */
export function validarCpf(cpf: string): boolean {
  const d = (cpf || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +d[i] * (10 - i);
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  s = 0;
  for (let i = 0; i < 10; i++) s += +d[i] * (11 - i);
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d.endsWith(`${d1}${d2}`);
}

export function validarCnpjNumerico(cnpj: string): boolean {
  const d = (cnpj || '').replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d[i] * w1[i];
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  s = 0;
  for (let i = 0; i < 12; i++) s += +d[i] * w2[i];
  s += d1 * w2[12];
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d.endsWith(`${d1}${d2}`);
}

function valorCnpjAlfa(c: string): number {
  const u = c.toUpperCase();
  return u >= '0' && u <= '9' ? u.charCodeAt(0) - 48 : u.charCodeAt(0) - 55;
}

export function validarCnpjAlfanumerico(cnpj: string): boolean {
  const raw = (cnpj || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (raw.length !== 14) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += valorCnpjAlfa(raw[i]) * w1[i];
  let r = s % 11;
  const dv1 = r < 2 ? 0 : 11 - r;
  s = 0;
  for (let i = 0; i < 12; i++) s += valorCnpjAlfa(raw[i]) * w2[i];
  s += dv1 * w2[12];
  r = s % 11;
  const dv2 = r < 2 ? 0 : 11 - r;
  return raw[12] === String(dv1) && raw[13] === String(dv2);
}

export function validarCnpj(cnpj: string): boolean {
  const raw = (cnpj || '').replace(/[^0-9A-Za-z]/g, '');
  if (/^\d+$/.test(raw)) return validarCnpjNumerico(raw);
  return validarCnpjAlfanumerico(raw);
}

export function validarCpfCnpj(valor: string): boolean {
  const raw = (valor || '').replace(/[^0-9A-Za-z]/g, '');
  if (raw.length <= 11) return validarCpf(raw.padStart(11, '0').slice(-11));
  return validarCnpj(valor);
}

export function mascaraCpf(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascaraCnpj(v: string): string {
  const d = v.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function mascaraCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function somenteDigitos(v: string): string {
  return (v || '').replace(/\D/g, '');
}
