import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../icone';
import type { HugImageLayout } from '../hug-image-upload/hug-image-layout';
import type { HugArquivoPreviewTipo } from '../hug-file-upload/hug-arquivo.util';

@Component({
  selector: 'app-hug-file-preview',
  standalone: true,
  imports: [CommonModule, Icone],
  template: `
    @if (compacta) {
      <div
        class="hug-img-preview hug-img-preview--compacta"
        [class.hug-img-preview--arrastando]="arrastando"
        [class.hug-img-preview--desabilitado]="desabilitadoVisual"
        [class.hug-img-preview--somente-leitura]="somenteLeitura"
        [class.hug-img-preview--carregando]="carregando"
        [class.hug-img-preview--com-arquivo]="temArquivo">
        @if (temArquivo) {
          <div class="hug-img-preview__compacto-anexo" [attr.aria-label]="labelQuadro">
            @if (carregando) {
              <div class="hug-img-preview__compacto-carregando" aria-hidden="true">
                <span class="hug-img-preview__carregando-anel"></span>
              </div>
            }
            <div class="hug-img-preview__compacto-icone" [class.hug-img-preview__compacto-icone--pdf]="tipoPreview === 'pdf'" aria-hidden="true">
              <app-icone [nome]="iconeTipoArquivo" [tamanho]="20" />
            </div>
            <div class="hug-img-preview__compacto-texto">
              <span class="hug-img-preview__compacto-nome" [title]="nomeExibicao">{{ nomeExibicao }}</span>
              <span class="hug-img-preview__compacto-tipo">{{ rotuloTipoArquivo }} · Anexo</span>
            </div>
          </div>
        } @else {
          <div
            class="hug-img-preview__compacto-vazio"
            [attr.role]="bloquearSelecao ? null : 'button'"
            [attr.tabindex]="bloquearSelecao ? -1 : 0"
            [attr.aria-disabled]="bloquearSelecao"
            [attr.aria-busy]="carregando ? 'true' : null"
            [attr.aria-label]="labelQuadro"
            (click)="aoQuadroClick($event)"
            (keydown.enter)="!bloquearSelecao && acaoSubstituir.emit()"
            (keydown.space)="$event.preventDefault(); !bloquearSelecao && acaoSubstituir.emit()">
            @if (carregando) {
              <span class="hug-img-preview__carregando-anel" aria-hidden="true"></span>
            } @else {
              <app-icone [nome]="iconePlaceholder" [tamanho]="18" />
              <span class="hug-img-preview__compacto-vazio-texto">{{ tituloVazio }}</span>
              <span class="hug-img-preview__compacto-vazio-dica">Clique ou arraste</span>
            }
          </div>
        }
        <ng-container *ngTemplateOutlet="barraAcoes" />
      </div>
    } @else {
      <div
        class="hug-img-preview"
        [class.hug-img-preview--paisagem]="layout === 'paisagem'"
        [class.hug-img-preview--quadrado]="layout === 'quadrado'"
        [class.hug-img-preview--arrastando]="arrastando"
        [class.hug-img-preview--desabilitado]="desabilitadoVisual"
        [class.hug-img-preview--somente-leitura]="somenteLeitura"
        [class.hug-img-preview--carregando]="carregando"
        [class.hug-img-preview--preencher]="preencherLargura"
        [class.hug-img-preview--alinhada]="alinharAlturaPar"
        [class.hug-img-preview--com-arquivo]="temArquivo">
        <div
          class="hug-img-preview__quadro"
          [class.hug-img-preview__quadro--pdf]="tipoPreview === 'pdf'"
          [attr.role]="bloquearSelecao ? null : 'button'"
          [attr.tabindex]="bloquearSelecao || temArquivo ? -1 : 0"
          [attr.aria-disabled]="bloquearSelecao"
          [attr.aria-busy]="carregando ? 'true' : null"
          [attr.aria-label]="labelQuadro"
          (click)="aoQuadroClick($event)"
          (keydown.enter)="!bloquearSelecao && !temArquivo && acaoSubstituir.emit()"
          (keydown.space)="$event.preventDefault(); !bloquearSelecao && !temArquivo && acaoSubstituir.emit()">
          @if (carregando) {
            <div class="hug-img-preview__carregando" aria-hidden="true">
              <span class="hug-img-preview__carregando-anel"></span>
              <span class="hug-img-preview__carregando-texto">Carregando…</span>
            </div>
          }
          @if (tipoPreview === 'imagem' && previewUrl) {
            <img class="hug-img-preview__img" [src]="previewUrl" [alt]="alt" [class.hug-img-preview__img--esmaecida]="carregando" />
          } @else if (tipoPreview === 'pdf') {
            <div class="hug-img-preview__arquivo hug-img-preview__arquivo--pdf">
              <app-icone nome="file-text" [tamanho]="layout === 'paisagem' ? 30 : 26" />
              <span class="hug-img-preview__arquivo-tipo">PDF</span>
              <span class="hug-img-preview__arquivo-nome" [title]="nomeExibicao">{{ nomeExibicao }}</span>
            </div>
          } @else if (!carregando) {
            <div class="hug-img-preview__placeholder">
              <app-icone [nome]="iconePlaceholder" [tamanho]="layout === 'paisagem' ? 26 : 22" />
              <span class="hug-img-preview__placeholder-titulo">{{ tituloVazio }}</span>
              <span class="hug-img-preview__placeholder-dica">Clique ou arraste para enviar</span>
            </div>
          }
        </div>
        <ng-container *ngTemplateOutlet="barraAcoes" />
      </div>
    }

    <ng-template #barraAcoes>
      <div
        class="hug-img-preview__barra"
        [class.hug-img-preview__barra--compacta]="compacta"
        [class.hug-img-preview__barra--inativa]="!temArquivo"
        [class.hug-img-preview__barra--alinhada]="alinharAlturaPar"
        [attr.role]="temArquivo ? 'toolbar' : null"
        [attr.aria-hidden]="temArquivo ? null : 'true'"
        [attr.aria-label]="temArquivo ? 'Ações: ' + alt : null">
        @if (temArquivo) {
          @if (exibirVisualizar) {
            <button
              type="button"
              class="hug-img-preview__acao"
              title="Visualizar"
              aria-label="Visualizar"
              [disabled]="carregando"
              (click)="visualizar($event)">
              <app-icone nome="eye" [tamanho]="14" />
              <span>Visualizar</span>
            </button>
          }
          @if (exibirBaixar) {
            <button
              type="button"
              class="hug-img-preview__acao"
              title="Baixar"
              aria-label="Baixar arquivo"
              [disabled]="carregando"
              (click)="baixar($event)">
              <app-icone nome="download" [tamanho]="14" />
              <span>Baixar</span>
            </button>
          }
          @if (exibirSubstituir) {
            <button
              type="button"
              class="hug-img-preview__acao"
              title="Substituir arquivo"
              aria-label="Substituir arquivo"
              [disabled]="bloquearEdicao"
              (click)="substituir($event)">
              <app-icone nome="upload" [tamanho]="14" />
              <span>Substituir</span>
            </button>
          }
          @if (exibirRemover) {
            <button
              type="button"
              class="hug-img-preview__acao hug-img-preview__acao--perigo"
              title="Remover arquivo"
              aria-label="Remover arquivo"
              [disabled]="bloquearEdicao"
              (click)="remover($event)">
              <app-icone nome="trash" [tamanho]="14" />
              <span>Remover</span>
            </button>
          }
        }
      </div>
    </ng-template>
  `,
})
export class HugFilePreviewComponent {
  @Input() previewUrl: string | null = null;
  @Input() tipoPreview: HugArquivoPreviewTipo | null = null;
  @Input() nomeArquivo: string | null = null;
  @Input() alt = 'Pré-visualização';
  @Input() layout: HugImageLayout = 'paisagem';
  @Input() iconePlaceholder = 'image';
  @Input() tituloVazio = 'Nenhum arquivo';
  @Input() disabled = false;
  @Input() somenteLeitura = false;
  @Input() carregando = false;
  @Input() arrastando = false;
  @Input() preencherLargura = false;
  @Input() alinharAlturaPar = false;
  @Input() compacta = false;
  @Input() exibirVisualizar = true;
  @Input() exibirSubstituir = true;
  @Input() exibirRemover = true;
  @Input() exibirBaixar = false;

  @Output() acaoSubstituir = new EventEmitter<void>();
  @Output() acaoVisualizar = new EventEmitter<void>();
  @Output() acaoRemover = new EventEmitter<void>();
  @Output() acaoBaixar = new EventEmitter<void>();

  get temArquivo(): boolean {
    return this.tipoPreview === 'pdf' || (this.tipoPreview === 'imagem' && !!this.previewUrl);
  }

  get nomeExibicao(): string {
    if (this.nomeArquivo?.trim()) return this.nomeArquivo.trim();
    if (this.tipoPreview === 'pdf') return 'Documento PDF';
    if (this.tipoPreview === 'imagem') return 'Imagem anexada';
    return 'Arquivo anexado';
  }

  get iconeTipoArquivo(): string {
    if (this.tipoPreview === 'pdf') return 'file-text';
    if (this.tipoPreview === 'imagem') return 'image';
    return this.iconePlaceholder;
  }

  get rotuloTipoArquivo(): string {
    if (this.tipoPreview === 'pdf') return 'PDF';
    if (this.tipoPreview === 'imagem') return 'Imagem';
    return 'Arquivo';
  }

  get labelQuadro(): string {
    if (this.temArquivo) return this.alt;
    return `Selecionar arquivo: clique ou arraste`;
  }

  get bloquearEdicao(): boolean {
    return this.disabled || this.somenteLeitura || this.carregando;
  }

  get bloquearSelecao(): boolean {
    return this.bloquearEdicao;
  }

  get desabilitadoVisual(): boolean {
    return this.disabled || this.carregando;
  }

  aoQuadroClick(ev: MouseEvent): void {
    if (this.bloquearSelecao) return;
    const alvo = ev.target as HTMLElement;
    if (alvo.closest('.hug-img-preview__acao')) return;
    if (!this.temArquivo) this.acaoSubstituir.emit();
  }

  visualizar(ev: Event): void {
    ev.stopPropagation();
    this.acaoVisualizar.emit();
  }

  baixar(ev: Event): void {
    ev.stopPropagation();
    this.acaoBaixar.emit();
  }

  substituir(ev: Event): void {
    ev.stopPropagation();
    if (!this.bloquearEdicao) this.acaoSubstituir.emit();
  }

  remover(ev: Event): void {
    ev.stopPropagation();
    if (!this.bloquearEdicao) this.acaoRemover.emit();
  }
}
