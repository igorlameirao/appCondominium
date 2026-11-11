import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';

interface KpiCard {
  rotulo: string;
  valor: string;
  variacao: string;
  tendencia: 'up' | 'down' | 'neutro';
  icone: string;
}

interface MesValor {
  mes: string;
  valor: number;
}

interface CategoriaDespesa {
  nome: string;
  pct: number;
  cor: string;
}

interface BlocoOcupacao {
  nome: string;
  pct: number;
}

/** Placeholder até existir API de dashboard. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly kpis: KpiCard[] = [
    { rotulo: 'Unidades ativas', valor: '248', variacao: '+3%', tendencia: 'up', icone: 'building' },
    { rotulo: 'Moradores cadastrados', valor: '612', variacao: '+12', tendencia: 'up', icone: 'users' },
    { rotulo: 'Despesas do mês', valor: 'R$ 84,2k', variacao: '-5%', tendencia: 'down', icone: 'wallet' },
    { rotulo: 'Encomendas pendentes', valor: '17', variacao: '3 novas', tendencia: 'neutro', icone: 'message-square' },
  ];

  readonly despesasMensais: MesValor[] = [
    { mes: 'Abr', valor: 72 },
    { mes: 'Mai', valor: 79 },
    { mes: 'Jun', valor: 68 },
    { mes: 'Jul', valor: 81 },
    { mes: 'Ago', valor: 76 },
    { mes: 'Set', valor: 88 },
    { mes: 'Out', valor: 84 },
    { mes: 'Nov', valor: 91 },
  ];

  readonly categoriasDespesa: CategoriaDespesa[] = [
    { nome: 'Manutenção', pct: 32, cor: '#0e7490' },
    { nome: 'Pessoal', pct: 28, cor: '#38bdf8' },
    { nome: 'Utilidades', pct: 22, cor: '#67e8f9' },
    { nome: 'Outros', pct: 18, cor: '#cbd5e1' },
  ];

  /** Série diária fictícia de consumo (m³). */
  readonly consumoAgua = [42, 38, 44, 51, 47, 45, 49, 53, 50, 48, 46, 52, 55, 51];

  readonly ocupacaoBlocos: BlocoOcupacao[] = [
    { nome: 'Bloco A', pct: 96 },
    { nome: 'Bloco B', pct: 88 },
    { nome: 'Bloco C', pct: 82 },
    { nome: 'Bloco D', pct: 74 },
  ];

  private readonly maxDespesa = Math.max(...this.despesasMensais.map(d => d.valor));

  get gradienteDonut(): string {
    let inicio = 0;
    const partes = this.categoriasDespesa.map(cat => {
      const fim = inicio + cat.pct;
      const fatia = `${cat.cor} ${inicio}% ${fim}%`;
      inicio = fim;
      return fatia;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  get pontosLinhaAgua(): string {
    return this.pontosSerie(this.consumoAgua, false);
  }

  get pontosAreaAgua(): string {
    const linha = this.pontosSerie(this.consumoAgua, false);
    const base = '0,130 400,130';
    return `${linha} ${base}`;
  }

  get descricaoBarras(): string {
    return this.despesasMensais.map(d => `${d.mes}: ${d.valor}`).join('; ');
  }

  get descricaoLinha(): string {
    return `Consumo diário em m³: ${this.consumoAgua.join(', ')}`;
  }

  classeVariacao(tendencia: KpiCard['tendencia']): string {
    if (tendencia === 'up') return 'home-kpi__variacao--up';
    if (tendencia === 'down') return 'home-kpi__variacao--down';
    return 'home-kpi__variacao--neutro';
  }

  alturaBarra(valor: number): number {
    const pct = (valor / this.maxDespesa) * 100;
    return Math.max(12, Math.round(pct));
  }

  private pontosSerie(valores: number[], invertY = true): string {
    const w = 400;
    const h = 130;
    const pad = 8;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const range = max - min || 1;
    return valores
      .map((v, i) => {
        const x = pad + (i / Math.max(1, valores.length - 1)) * (w - pad * 2);
        const norm = (v - min) / range;
        const y = invertY ? h - pad - norm * (h - pad * 2) : pad + norm * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
}
