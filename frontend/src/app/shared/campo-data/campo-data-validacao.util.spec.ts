import {
  avaliarTextoData,
  dataAceita,
  normalizarDataLocal,
  resolverData,
  resolverDataCommit,
} from './campo-data-validacao.util';

function expectCompleta(r: ReturnType<typeof avaliarTextoData>): asserts r is { incompleta: false; valida: boolean; data: Date | null } {
  expect(r.incompleta).withContext('esperava data completa no input').toBe(false);
}

describe('campo-data-validacao.util', () => {
  it('1 — data válida digitada (dd/mm/aaaa)', () => {
    const r = avaliarTextoData('12/03/1990', true);
    expectCompleta(r);
    expect(r.valida).toBe(true);
    expect(r.data?.getFullYear()).toBe(1990);
  });

  it('2 — data válida pelo calendário (Date no picker, texto vazio ou legado)', () => {
    const picker = new Date(1990, 2, 12);
    const d = resolverData('', picker);
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(12);
    expect(d!.getMonth()).toBe(2);
  });

  it('3 — corrigir data inválida para válida', () => {
    const inv = avaliarTextoData('31/02/2024', false);
    expectCompleta(inv);
    expect(inv.valida).toBe(false);
    const ok = avaliarTextoData('29/02/2024', false);
    expectCompleta(ok);
    expect(ok.valida).toBe(true);
  });

  it('4 — data inexistente 31/02/2024', () => {
    const r = avaliarTextoData('31/02/2024', false);
    expectCompleta(r);
    expect(r.valida).toBe(false);
  });

  it('5 — nascimento futuro inválido', () => {
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    const texto = `${String(futuro.getDate()).padStart(2, '0')}/${String(futuro.getMonth() + 1).padStart(2, '0')}/${futuro.getFullYear()}`;
    const r = avaliarTextoData(texto, true);
    expectCompleta(r);
    expect(r.valida).toBe(false);
    expect(dataAceita(normalizarDataLocal(futuro), true)).toBe(false);
  });

  it('6 — texto incompleto não é erro de validação (equiv. apagar parcial)', () => {
    const r = avaliarTextoData('12/03', true);
    expect(r.incompleta).toBe(true);
  });

  it('7 — texto vazio após apagar obrigatório (incompleto, sem flag inválida por formato)', () => {
    const r = avaliarTextoData('', true);
    expect(r.incompleta).toBe(true);
  });

  it('dateChange: 31/02 permanece inválido mesmo com picker', () => {
    const picker = new Date(1990, 5, 15);
    expect(resolverDataCommit('31/02/2024', picker)).toBe('invalida');
  });

  it('dateChange: digitação parcial não usa picker (01/01/2001)', () => {
    const picker = new Date(2001, 0, 1);
    expect(resolverDataCommit('1', picker)).toBe('invalida');
    expect(resolverDataCommit('12/03', picker)).toBe('invalida');
  });

  it('dateChange: calendário com input vazio usa picker', () => {
    const picker = new Date(1990, 5, 15);
    const r = resolverDataCommit('', picker);
    expect(r).not.toBe('limpar');
    expect(r).not.toBe('invalida');
    if (r instanceof Date) {
      expect(r.getMonth()).toBe(5);
      expect(r.getDate()).toBe(15);
    }
  });
});
