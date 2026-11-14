export type PassoLogin = 'LOGIN' | 'SELECT_CONDO' | 'SELECT_PROFILE';

export interface PerfilVinculo {
  idPerfil: number;
  nome: string;
}

export interface CondominioVinculo {
  idCondominio: number;
  nome: string;
  perfis: PerfilVinculo[];
  dominio?: string | null;
}

export type DestinoLogin =
  | { acao: 'sem-vinculo' }
  | { acao: 'autenticar'; idCondominio: number; idPerfil: number | null }
  | { acao: 'selecionar-condominio' }
  | { acao: 'selecionar-perfil'; idCondominio: number };

/** Um condomínio segue direto para o perfil (ou autentica). Vários condomínios param na escolha. */
export function destinoAposCredenciais(vinculos: CondominioVinculo[]): DestinoLogin {
  if (vinculos.length === 0) return { acao: 'sem-vinculo' };
  if (vinculos.length === 1) return destinoAposCondominio(vinculos[0]);
  return { acao: 'selecionar-condominio' };
}

export type DestinoTenant =
  | { acao: 'sem-acesso' }
  | { acao: 'autenticar'; idCondominio: number; idPerfil: number | null }
  | { acao: 'selecionar-perfil'; idCondominio: number };

/**
 * No login com tenant o condomínio já veio na URL.
 * Outros condomínios do usuário não abrem a etapa de escolha.
 */
export function destinoNoTenant(vinculos: CondominioVinculo[], idCondominio: number): DestinoTenant {
  const condo = vinculos.find(v => v.idCondominio === idCondominio);
  if (!condo) return { acao: 'sem-acesso' };
  const destino = destinoAposCondominio(condo);
  if (destino.acao === 'autenticar') {
    return { acao: 'autenticar', idCondominio: destino.idCondominio, idPerfil: destino.idPerfil };
  }
  if (destino.acao === 'selecionar-perfil') {
    return { acao: 'selecionar-perfil', idCondominio: destino.idCondominio };
  }
  return { acao: 'sem-acesso' };
}

export function mensagemErroLogin(e: unknown): string {
  const err = e as { status?: number; error?: { title?: string; message?: string } | string };
  if (err?.status === 0) {
    return 'Não foi possível conectar ao servidor. Verifique a rede e se a API está no ar.';
  }
  const body = err?.error;
  const msg = typeof body === 'string' ? body : body?.title ?? body?.message;
  return msg || 'E-mail ou senha inválidos. Tente novamente.';
}

/** Um perfil autentica. Mais de um exige a escolha. Nenhum usa o perfil padrão do servidor. */
export function destinoAposCondominio(condo: CondominioVinculo): DestinoLogin {
  const perfis = condo.perfis ?? [];
  if (perfis.length === 1) {
    return { acao: 'autenticar', idCondominio: condo.idCondominio, idPerfil: perfis[0].idPerfil };
  }
  if (perfis.length > 1) {
    return { acao: 'selecionar-perfil', idCondominio: condo.idCondominio };
  }
  return { acao: 'autenticar', idCondominio: condo.idCondominio, idPerfil: null };
}
