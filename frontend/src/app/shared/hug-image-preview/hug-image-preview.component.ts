import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../icone';
import type { HugImageLayout } from '../hug-image-upload/hug-image-layout';

@Component({
  selector: 'app-hug-image-preview',
  standalone: true,
  imports: [CommonModule, Icone],
  template: `
    <div
      class="hug-img-preview"
      [class.hug-img-preview--paisagem]="layout === 'paisagem'"
      [class.hug-img-preview--quadrado]="layout === 'quadrado'"
      [class.hug-img-preview--arrastando]="arrastando"
      [class.hug-img-preview--desabilitado]="desabilitadoVisual"
      [class.hug-img-preview--somente-leitura]="somenteLeitura"
      [class.hug-img-preview--carregando]="carregando"
      [class.hug-img-preview--preencher]="preencherLargura"
      [class.hug-img-preview--alinhada]="alinharAlturaPar">
      <div
        class="hug-img-preview__quadro"
        [attr.role]="bloquearSelecao ? null : 'button'"
        [attr.tabindex]="bloquearSelecao || url ? -1 : 0"
        [attr.aria-disabled]="bloquearSelecao"
        [attr.aria-busy]="carregando ? 'true' : null"
        [attr.aria-label]="url ? alt : 'Selecionar imagem: clique ou arraste o arquivo'"
        (click)="aoQuadroClick($event)"
        (keydown.enter)="!bloquearSelecao && !url && acaoSubstituir.emit()"
        (keydown.space)="$event.preventDefault(); !bloquearSelecao && !url && acaoSubstituir.emit()">
        @if (carregando) {
          <div class="hug-img-preview__carregando" aria-hidden="true">
            <span class="hug-img-preview__carregando-anel"></span>
            <span class="hug-img-preview__carregando-texto">Carregando…</span>
          </div>
        }
        @if (url) {
          <img class="hug-img-preview__img" [src]="url" [alt]="alt" [class.hug-img-preview__img--esmaecida]="carregando" />
        } @else if (!carregando) {
          <div class="hug-img-preview__placeholder">
            <app-icone [nome]="iconePlaceholder" [tamanho]="layout === 'paisagem' ? 26 : 22" />
            <span class="hug-img-preview__placeholder-titulo">Nenhuma imagem</span>
            <span class="hug-img-preview__placeholder-dica">Clique ou arraste para enviar</span>
          </div>
        }
      </div>
      <div
        class="hug-img-preview__barra"
        [class.hug-img-preview__barra--inativa]="!url"
        [class.hug-img-preview__barra--alinhada]="alinharAlturaPar"
        [attr.role]="url ? 'toolbar' : null"
        [attr.aria-hidden]="url ? null : 'true'"
        [attr.aria-label]="url ? 'Ações: ' + alt : null">
        @if (url) {
          @if (exibirVisualizar) {
            <button
              type="button"
              class="hug-img-preview__acao"
              title="Visualizar ampliado"
              aria-label="Visualizar ampliado"
              [disabled]="carregando"
              (click)="visualizar($event)">
              <app-icone nome="eye" [tamanho]="14" />
              <span>Visualizar</span>
            </button>
          }
          @if (exibirSubstituir) {
            <button
              type="button"
              class="hug-img-preview__acao"
              title="Substituir imagem"
              aria-label="Substituir imagem"
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
              title="Remover imagem"
              aria-label="Remover imagem"
              [disabled]="bloquearEdicao"
              (click)="remover($event)">
              <app-icone nome="trash" [tamanho]="14" />
              <span>Remover</span>
            </button>
          }
        }
      </div>
    </div>
  `,
})
export class HugImagePreviewComponent {
  @Input() url: string | null = null;
  @Input() alt = 'Pré-visualização';
  @Input() layout: HugImageLayout = 'paisagem';
  @Input() iconePlaceholder = 'image';
  @Input() disabled = false;
  /** Mantém Visualizar; bloqueia envio, substituição e remoção (ex.: detalhe sem permissão de edição). */
  @Input() somenteLeitura = false;
  @Input() carregando = false;
  @Input() arrastando = false;
  @Input() preencherLargura = false;
  /** Par de cards com altura igual (ex.: config. condomínio). */
  @Input() alinharAlturaPar = false;
  @Input() exibirVisualizar = true;
  @Input() exibirSubstituir = true;
  @Input() exibirRemover = true;

  @Output() acaoSubstituir = new EventEmitter<void>();
  @Output() acaoVisualizar = new EventEmitter<void>();
  @Output() acaoRemover = new EventEmitter<void>();

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
    if (!this.url) this.acaoSubstituir.emit();
  }

  visualizar(ev: Event): void {
    ev.stopPropagation();
    this.acaoVisualizar.emit();
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
