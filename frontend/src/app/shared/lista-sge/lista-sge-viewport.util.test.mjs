import assert from 'node:assert/strict';
import {
  calcularAlturaScrollMax,
  calcularCapacidadeLinhas,
  calcularEspacoScrollCentralCobranca,
  estimarTamanhoPaginaInicial,
} from './lista-sge-viewport.util.ts';

assert.equal(calcularCapacidadeLinhas(400, 34, 32), 11);
assert.equal(calcularCapacidadeLinhas(80, 34, 32), 3);

const compacto = calcularAlturaScrollMax(34, 32, 5, 18, 500);
assert.equal(compacto, 34 + 5 * 32);

const cheio = calcularAlturaScrollMax(34, 32, 18, 18, 500);
assert.equal(cheio, 500);

assert.ok(estimarTamanhoPaginaInicial() >= 3);

// Regressão: rodapé colado a scroll de 1 linha não pode definir o teto (~66px).
const espacoColuna = calcularEspacoScrollCentralCobranca({
  scrollTop: 100,
  limiteInferior: 800,
  rodapeHeight: 40,
  paddingPainelBottom: 0,
  margemInferior: 12,
});
assert.ok(espacoColuna > 200, `esperado espaço amplo na coluna, obteve ${espacoColuna}`);

const espacoAntigoUmaLinha = 100 + 66 - 100;
assert.ok(espacoColuna > espacoAntigoUmaLinha);

console.log('lista-sge-viewport.util.test.mjs OK');
