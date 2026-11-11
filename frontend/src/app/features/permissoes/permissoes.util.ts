export interface PermissaoLinha {
  permissionKey: string;
  displayName: string;
  modulo: string;
  visualizar: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
}

export interface PerfilOpcao {
  idPerfil: number;
  descricao: string;
}

export interface PessoaOpcao {
  idPessoa: number;
  nome: string;
  idPerfil?: number | null;
  perfilDescricao?: string | null;
}

export interface ModuloPermissao {
  modulo: string;
  linhas: PermissaoLinha[];
}

export const CAMPOS_ACAO = ['visualizar', 'incluir', 'alterar', 'excluir'] as const;
export type CampoAcao = (typeof CAMPOS_ACAO)[number];

export const ROTULO_ACAO: Record<CampoAcao, string> = {
  visualizar: 'Visualizar',
  incluir: 'Incluir',
  alterar: 'Alterar',
  excluir: 'Excluir',
};

export function agruparPorModulo(linhas: PermissaoLinha[]): ModuloPermissao[] {
  const map = new Map<string, PermissaoLinha[]>();
  for (const linha of linhas) {
    const lista = map.get(linha.modulo) ?? [];
    lista.push(linha);
    map.set(linha.modulo, lista);
  }
  return [...map.entries()].map(([modulo, grupo]) => ({ modulo, linhas: grupo }));
}

export function clonarLinhas(linhas: PermissaoLinha[]): PermissaoLinha[] {
  return linhas.map(l => ({ ...l }));
}

export function linhasIguais(a: PermissaoLinha[], b: PermissaoLinha[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.permissionKey !== y.permissionKey
      || x.visualizar !== y.visualizar
      || x.incluir !== y.incluir
      || x.alterar !== y.alterar
      || x.excluir !== y.excluir
    ) return false;
  }
  return true;
}

export function ehPerfilAdministrador(descricao: string | null | undefined): boolean {
  return (descricao ?? '').trim().toLowerCase() === 'administrador';
}

export function valorAcao(linha: PermissaoLinha, campo: CampoAcao): boolean {
  return linha[campo];
}

export function definirAcao(linha: PermissaoLinha, campo: CampoAcao, ligado: boolean): void {
  linha[campo] = ligado;
}

export function linhaMarcada(linha: PermissaoLinha): boolean {
  return CAMPOS_ACAO.every(c => linha[c]);
}

export function linhaIndeterminada(linha: PermissaoLinha): boolean {
  const algum = CAMPOS_ACAO.some(c => linha[c]);
  return algum && !linhaMarcada(linha);
}

export function alternarLinha(linha: PermissaoLinha, ligado: boolean): void {
  for (const campo of CAMPOS_ACAO) definirAcao(linha, campo, ligado);
}

export function moduloMarcado(grupo: ModuloPermissao): boolean {
  return grupo.linhas.length > 0 && grupo.linhas.every(linhaMarcada);
}

export function moduloIndeterminado(grupo: ModuloPermissao): boolean {
  const alguma = grupo.linhas.some(l => CAMPOS_ACAO.some(c => l[c]));
  return alguma && !moduloMarcado(grupo);
}

export function alternarModulo(grupo: ModuloPermissao, ligado: boolean): void {
  for (const linha of grupo.linhas) alternarLinha(linha, ligado);
}
