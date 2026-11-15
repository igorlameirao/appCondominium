import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CondominioTrocaItem {
  idCondominio: number;
  nome: string;
  dominio?: string | null;
}

@Component({
  selector: 'app-trocar-condominio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (aberto) {
      <div
        class="confirm-overlay tenant-troca-overlay"
        role="presentation"
        (click)="fechar.emit()"
        (keydown.escape)="fechar.emit()">
        <div
          class="confirm-modal modal-sge-form tenant-troca-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tenant-troca-titulo"
          (click)="$event.stopPropagation()"
          (keydown.escape)="fechar.emit()">
          <header class="tenant-troca-modal__cabecalho">
            <h2 id="tenant-troca-titulo">Trocar condomínio</h2>
            <p class="tenant-troca-modal__subtitulo">Selecione o condomínio que deseja acessar</p>
          </header>

          <div class="tenant-troca-modal__corpo">
            @if (exibirBusca) {
              <div class="tenant-troca-modal__busca">
                <label class="visually-hidden" for="tenant-troca-busca">Pesquisar condomínio</label>
                <input
                  id="tenant-troca-busca"
                  type="search"
                  [(ngModel)]="termoBusca"
                  placeholder="Pesquisar por nome..."
                  autocomplete="off" />
              </div>
            }

            @if (listaFiltrada.length === 0) {
              <p class="tenant-troca-modal__vazio" role="status">
                {{ termoBusca.trim() ? 'Nenhum condomínio corresponde à pesquisa.' : 'Nenhum condomínio disponível.' }}
              </p>
            } @else {
              <ul class="tenant-troca-modal__lista" role="listbox" aria-label="Condomínios disponíveis">
                @for (item of listaFiltrada; track item.idCondominio) {
                  <li>
                    <button
                      type="button"
                      class="tenant-troca-item"
                      [class.tenant-troca-item--atual]="ehAtual(item.idCondominio)"
                      [class.tenant-troca-item--selecionado]="selecionadoId === item.idCondominio"
                      [disabled]="ehAtual(item.idCondominio)"
                      [attr.aria-current]="ehAtual(item.idCondominio) ? 'true' : null"
                      [attr.aria-selected]="selecionadoId === item.idCondominio"
                      (click)="selecionar(item.idCondominio)">
                      <span class="tenant-troca-item__topo">
                        <span class="tenant-troca-item__nome">{{ item.nome }}</span>
                        @if (ehAtual(item.idCondominio)) {
                          <span class="tenant-troca-item__badge">Atual</span>
                        }
                      </span>
                      @if (detalheItem(item); as detalhe) {
                        <span class="tenant-troca-item__detalhe">{{ detalhe }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          <footer class="tenant-troca-modal__rodape">
            <button type="button" class="btn-cancelar-modal" (click)="fechar.emit()">
              Cancelar
            </button>
            <button
              type="button"
              class="btn-confirm-ok"
              [disabled]="!podeConfirmar"
              (click)="confirmar.emit(selecionadoId!)">
              Confirmar
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class TrocarCondominioModalComponent implements OnChanges {
  @Input() aberto = false;
  @Input() condominios: CondominioTrocaItem[] = [];
  @Input() idAtual: number | null = null;
  @Input() selecionadoId: number | null = null;

  @Output() readonly fechar = new EventEmitter<void>();
  @Output() readonly confirmar = new EventEmitter<number>();
  @Output() readonly selecionadoIdChange = new EventEmitter<number>();

  termoBusca = '';

  get exibirBusca(): boolean {
    return this.condominios.length > 4;
  }

  get listaFiltrada(): CondominioTrocaItem[] {
    const q = this.termoBusca.trim().toLowerCase();
    if (!q) return this.condominios;
    return this.condominios.filter(c => c.nome.toLowerCase().includes(q));
  }

  get podeConfirmar(): boolean {
    if (this.selecionadoId == null) return false;
    return !this.ehAtual(this.selecionadoId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto'] && !this.aberto) this.termoBusca = '';
  }

  ehAtual(id: number): boolean {
    return this.idAtual != null && Number(this.idAtual) === Number(id);
  }

  detalheItem(item: CondominioTrocaItem): string | null {
    const dom = item.dominio?.trim();
    if (dom) return dom;
    return null;
  }

  selecionar(id: number): void {
    if (this.ehAtual(id)) return;
    this.selecionadoIdChange.emit(id);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.aberto) this.fechar.emit();
  }
}