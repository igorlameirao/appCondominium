/** Situação cadastral Ativo/Inativo na listagem (1/true → ativo; demais → inativo). Só exibição. */
export function ehRegistroCadastralAtivo(
  valor: number | boolean | string | undefined | null,
): boolean {
  if (valor === 1 || valor === true) return true;
  if (typeof valor === 'string') {
    const t = valor.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 's' || t === 'ativo';
  }
  return false;
}
