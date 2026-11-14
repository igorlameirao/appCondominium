import { CondominioVinculo, destinoAposCondominio, destinoAposCredenciais, destinoNoTenant } from './login-fluxo';

function condo(id: number, perfis: number[]): CondominioVinculo {
  return {
    idCondominio: id,
    nome: 'C' + id,
    perfis: perfis.map(p => ({ idPerfil: p, nome: 'P' + p }))
  };
}

describe('login-fluxo', () => {
  it('cenário A autentica sem etapas extras', () => {
    expect(destinoAposCredenciais([condo(1, [2])])).toEqual({
      acao: 'autenticar',
      idCondominio: 1,
      idPerfil: 2
    });
  });

  it('cenário B vai direto à escolha de perfil', () => {
    expect(destinoAposCredenciais([condo(1, [1, 2])])).toEqual({
      acao: 'selecionar-perfil',
      idCondominio: 1
    });
  });

  it('cenário C para na escolha de condomínio', () => {
    expect(destinoAposCredenciais([condo(1, [1]), condo(2, [2, 3])])).toEqual({
      acao: 'selecionar-condominio'
    });
  });

  it('subcenário C1 autentica quando o condomínio tem um perfil', () => {
    expect(destinoAposCondominio(condo(4, [3]))).toEqual({
      acao: 'autenticar',
      idCondominio: 4,
      idPerfil: 3
    });
  });

  it('subcenário C2 pede o perfil do condomínio escolhido', () => {
    expect(destinoAposCondominio(condo(4, [3, 5]))).toEqual({
      acao: 'selecionar-perfil',
      idCondominio: 4
    });
  });

  it('credencial sem vínculo não abre etapa', () => {
    expect(destinoAposCredenciais([])).toEqual({ acao: 'sem-vinculo' });
  });

  it('tenant com um perfil autentica nesse condomínio', () => {
    expect(destinoNoTenant([condo(1, [2]), condo(9, [1, 4])], 1)).toEqual({
      acao: 'autenticar',
      idCondominio: 1,
      idPerfil: 2
    });
  });

  it('tenant com vários perfis pede só o perfil, sem escolher condomínio', () => {
    expect(destinoNoTenant([condo(1, [2]), condo(9, [1, 4])], 9)).toEqual({
      acao: 'selecionar-perfil',
      idCondominio: 9
    });
  });

  it('tenant fora dos vínculos não avança', () => {
    expect(destinoNoTenant([condo(1, [2])], 8)).toEqual({ acao: 'sem-acesso' });
  });
});
