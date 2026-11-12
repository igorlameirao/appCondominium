/** Máscara e validação `dd/mm/aaaa` (compartilhado entre app-campo-data e app-campo-data-hora). */

export function aplicarMascaraData(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function dataParaDigitos(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}${mes}${data.getFullYear()}`;
}

export function posicaoAposDigitos(mascarado: string, digitos: number): number {
  if (digitos <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < mascarado.length; i++) {
    if (/\d/.test(mascarado[i])) vistos++;
    if (vistos === digitos) return i + 1;
  }
  return mascarado.length;
}

export function dataCompleta(valor: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valor);
}

export function parseDataEstrita(valor: string): Date | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(valor);
  if (!match) return null;
  const dia = +match[1];
  const mes = +match[2];
  const ano = +match[3];
  if (mes < 1 || mes > 12 || dia < 1 || ano < 1) return null;
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
  return data;
}
