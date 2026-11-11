import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icone } from './icone';

@Component({
  selector: 'app-paginacao',
  standalone: true,
  imports: [FormsModule, Icone],
  templateUrl: './paginacao.html',
})
export class Paginacao implements OnChanges {
  @Input() pagina = 1;
  @Input() total = 0;
  @Input() tamanho = 10;
  @Input() mostrarNovo = false;
  @Output() paginaChange = new EventEmitter<number>();
  @Output() novo = new EventEmitter<void>();

  /** `legado` mantém o visual das listagens antigas. `sge` usa o padrão de listagem. */
  @Input() modo: 'legado' | 'sge' = 'legado';
  /** Substantivo plural usado em "Mostrando X a Y de Z {rotulo}". */
  @Input() rotulo = 'registros';
  rascunho = 1;

  ngOnChanges() { this.rascunho = this.pagina; }

  get totalPaginas() { return Math.max(1, Math.ceil(this.total / this.tamanho)); }
  get semRegistros() { return this.total === 0; }
  get primeira() { return this.pagina <= 1 || this.semRegistros; }
  get ultima() { return this.pagina >= this.totalPaginas || this.semRegistros; }
  get inicioRegistro() { return this.semRegistros ? 0 : (this.pagina - 1) * this.tamanho + 1; }
  get fimRegistro() { return this.semRegistros ? 0 : Math.min(this.pagina * this.tamanho, this.total); }

  get paginasVisiveis(): number[] {
    if (this.semRegistros) return [];
    const janela = 5;
    const total = this.totalPaginas;
    let fim = Math.min(total, Math.max(this.pagina, 1) + 2);
    let inicio = Math.max(1, fim - janela + 1);
    fim = Math.min(total, inicio + janela - 1);
    const paginas: number[] = [];
    for (let n = inicio; n <= fim; n++) paginas.push(n);
    return paginas;
  }

  ir(pagina: number) {
    if (this.semRegistros || pagina < 1 || pagina > this.totalPaginas || pagina === this.pagina) return;
    this.paginaChange.emit(pagina);
  }

  confirmar() {
    const n = Number(this.rascunho);
    if (!Number.isInteger(n)) return;
    this.ir(n);
  }
}
