/** Situação cadastral Ativo/Inativo na listagem (1/true → ativo; demais → inativo). Só exibição. */
export function ehRegistroCadastralAtivo(
  valor: number | boolean | string | undefined | null,
): boolean {
  return valor === 1 || valor === true || valor === '1';
}
