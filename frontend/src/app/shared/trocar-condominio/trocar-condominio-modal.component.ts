import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Icone } from '../icone';

export interface CondominioTrocaItem {
  idCondominio: number;
  nome: string;
  dominio?: string | null;
  enderecoResumo?: string | null;
}

@Component({
  selector: 'app-trocar-condominio-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, Icone],
  template: `
    @if (aberto) {
      <div class="confirm-overlay tenant-troca-overlay" role="presentation">
        <div
          class="confirm-modal modal-sge-form tenant-troca-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tenant-troca-titulo">
          <header class="captura-modal__topo tenant-troca-modal__topo">
            <div class="tenant-troca-modal__titulo-grupo">
              <app-icone class="tenant-troca-modal__titulo-icone" nome="arrow-left-right" [tamanho]="20" />
              <h2 id="tenant-troca-titulo">Trocar condomínio</h2>
            </div>
            <button
              type="button"
              class="btn-ghost btn-icon btn-icon--sm"
              aria-label="Fechar"
              (click)="fechar.emit()">
              <app-icone nome="x" [tamanho]="16" />
            </button>
          </header>

          <div class="tenant-troca-modal__corpo modal-sge-form__corpo">
            <p class="tenant-troca-modal__subtitulo">Selecione o condomínio que deseja acessar:</p>

            @if (exibirBusca) {
              <div class="tenant-troca-modal__busca">
                <label class="visually-hidden" for="tenant-troca-busca">Pesquisar condomínio</label>
                <input
                  id="tenant-troca-busca"
                  type="search"
                  [(ngModel)]="termoBusca"
                  placeholder="Pesquisar por nome ou endereço..."
                  autocomplete="off" />
              </div>
            }

            @if (listaFiltrada.length === 0) {
              <p class="tenant-troca-modal__vazio" role="status">
                {{ termoBusca.trim() ? 'Nenhum condomínio corresponde à pesquisa.' : 'Nenhum condomínio disponível.' }}
              </p>
            } @else {
              <ul class="tenant-troca-modal__lista" role="radiogroup" aria-label="Condomínios disponíveis">
                @for (item of listaFiltrada; track item.idCondominio) {
                  <li>
                    <button
                      type="button"
                      class="tenant-troca-item"
                      role="radio"
                      [class.tenant-troca-item--atual]="ehAtual(item.idCondominio)"
                      [class.tenant-troca-item--selecionado]="selecionadoIgual(item.idCondominio)"
                      [disabled]="ehAtual(item.idCondominio)"
                      [attr.aria-checked]="radioMarcado(item.idCondominio)"
                      [attr.aria-current]="ehAtual(item.idCondominio) ? 'location' : null"
                      (click)="selecionar(item.idCondominio)">
                      <span class="tenant-troca-item__thumb" aria-hidden="true">
                        @if (exibirThumb(item.idCondominio)) {
                          <img
                            [src]="urlImagem(item.idCondominio)"
                            alt=""
                            loading="lazy"
                            decoding="async"
                            (error)="onImagemErro(item.idCondominio)" />
                        } @else {
                          <span class="tenant-troca-item__thumb-fallback">
                            <app-icone nome="building" [tamanho]="22" />
                          </span>
                        }
                      </span>
                      <span class="tenant-troca-item__corpo">
                        <span class="tenant-troca-item__nome-linha">
                          <span class="tenant-troca-item__nome">{{ item.nome }}</span>
                          @if (ehAtual(item.idCondominio)) {
                            <span class="tenant-troca-item__badge">Atual</span>
                          }
                        </span>
                        @if (enderecoExibir(item); as endereco) {
                          <span class="tenant-troca-item__endereco">{{ endereco }}</span>
                        }
                      </span>
                      <span
                        class="tenant-troca-item__radio"
                        [class.tenant-troca-item__radio--marcado]="radioMarcado(item.idCondominio)"
                        [class.tenant-troca-item__radio--atual]="ehAtual(item.idCondominio)"
                        aria-hidden="true">
                        <span class="tenant-troca-item__radio-ponto"></span>
                      </span>
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          <footer class="tenant-troca-modal__rodape captura-acoes modal-sge-form__rodape">
            <button type="button" class="btn-cancelar-modal" (click)="fechar.emit()">
              Cancelar
            </button>
            <button
              type="button"
              class="btn-confirm-ok"
              [disabled]="!podeConfirmar"
              (click)="confirmar.emit(selecionadoId!)">
              <app-icone nome="check" [tamanho]="14" />
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
  @Output() readonly selecionadoIdChange = new EventEmitter<number | null>();

  termoBusca = '';
  private readonly imagensIndisponiveis = new Set<number>();

  get exibirBusca(): boolean {
    return this.condominios.length > 4;
  }

  get listaFiltrada(): CondominioTrocaItem[] {
    const q = this.termoBusca.trim().toLowerCase();
    if (!q) return this.condominios;
    return this.condominios.filter(c => {
      const haystack = [c.nome, c.enderecoResumo, c.dominio]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  get podeConfirmar(): boolean {
    if (this.selecionadoId == null) return false;
    return !this.ehAtual(this.selecionadoId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aberto']?.currentValue === true) {
      this.termoBusca = '';
      this.imagensIndisponiveis.clear();
    } else if (changes['aberto'] && !this.aberto) {
      this.termoBusca = '';
    }
  }

  ehAtual(id: number): boolean {
    return this.idAtual != null && Number(this.idAtual) === Number(id);
  }

  enderecoExibir(item: CondominioTrocaItem): string | null {
    const endereco = item.enderecoResumo?.trim();
    if (endereco) return endereco;
    const dom = item.dominio?.trim();
    return dom || null;
  }

  urlImagem(idCondominio: number): string {
    return `${environment.apiUrl}/lookup/condominios/${idCondominio}/imagem-login`;
  }

  exibirThumb(idCondominio: number): boolean {
    return !this.imagensIndisponiveis.has(idCondominio);
  }

  onImagemErro(idCondominio: number): void {
    this.imagensIndisponiveis.add(idCondominio);
  }

  selecionadoIgual(id: number): boolean {
    return this.selecionadoId != null && Number(this.selecionadoId) === Number(id);
  }

  /** Rádio marcado no destino escolhido; sem escolha, marca o condomínio atual. */
  radioMarcado(id: number): boolean {
    if (this.selecionadoIgual(id)) return true;
    return this.selecionadoId == null && this.ehAtual(id);
  }

  selecionar(id: number): void {
    if (this.ehAtual(id)) return;
    this.selecionadoIdChange.emit(Number(id));
  }
}