import { ehRegistroCadastralAtivo } from './lst-situacao-cadastral.util';

describe('ehRegistroCadastralAtivo', () => {
  it('trata 1 e true como ativo', () => {
    expect(ehRegistroCadastralAtivo(1)).toBe(true);
    expect(ehRegistroCadastralAtivo(true)).toBe(true);
    expect(ehRegistroCadastralAtivo('1')).toBe(true);
  });

  it('trata 0, false e ausência como inativo', () => {
    expect(ehRegistroCadastralAtivo(0)).toBe(false);
    expect(ehRegistroCadastralAtivo(false)).toBe(false);
    expect(ehRegistroCadastralAtivo(null)).toBe(false);
    expect(ehRegistroCadastralAtivo(undefined)).toBe(false);
  });
});
