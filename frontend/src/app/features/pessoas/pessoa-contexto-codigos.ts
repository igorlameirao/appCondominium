/** Espelho de PapelVinculoCodigos (WebApi). */
export const PapelVinculoCodigo = {
  proprietario: 1,
  morador: 2,
  locatario: 3,
  dependenteUnidade: 4,
  familiarUnidade: 5,
  hospede: 6,
  corretor: 7,
  visitante: 8,
  sindico: 10,
  subsindico: 11,
  conselheiro: 12,
  administradora: 13,
  funcionario: 14,
  prestadorCondominio: 15,
  terceirizado: 16,
  fornecedor: 17,
  entregador: 18,
  representanteLegal: 20,
  familiarPessoa: 21,
  dependentePessoa: 22,
  prestadorUnidade: 23,
} as const;

/** Papéis sem tela contextual e ocultos no combobox de novo vínculo. */
export const PAPEIS_EXCLUIDOS: number[] = [
  PapelVinculoCodigo.dependenteUnidade,
  PapelVinculoCodigo.familiarUnidade,
  PapelVinculoCodigo.corretor,
  PapelVinculoCodigo.familiarPessoa,
  PapelVinculoCodigo.dependentePessoa,
];

export function papelExcluido(codigo?: number | null): boolean {
  return codigo != null && PAPEIS_EXCLUIDOS.includes(codigo);
}
