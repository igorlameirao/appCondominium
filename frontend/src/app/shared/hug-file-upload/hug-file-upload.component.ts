import { Component, EventEmitter, HostListener, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugFilePreviewComponent } from '../hug-file-preview/hug-file-preview.component';
import { ModalArquivoVisualizacaoComponent } from '../modal-arquivo-visualizacao/modal-arquivo-visualizacao.component';
import type { HugImageLayout } from '../hug-image-upload/hug-image-layout';
import {
  arquivoAceitoPeloAccept,
  classificarArquivoPreview,
  type HugArquivoPreviewTipo,
} from './hug-arquivo.util';

export type { HugImageLayout };

@Component({
  selector: 'app-hug-file-upload',
  standalone: true,
  imports: [CommonModule, HugFilePreviewComponent, ModalArquivoVisualizacaoComponent],
  template: `
    <div
      class="hug-img-upload"
      [class.hug-img-upload--card]="varianteCard"
      [class.hug-img-upload--paisagem]="layout === 'paisagem'"
      [class.hug-img-upload--quadrado]="layout === 'quadrado'"
      [class.hug-img-upload--desabilitado]="disabled"
      [class.hug-img-upload--somente-leitura]="somenteLeitura"
      [class.hug-img-upload--carregando]="carregando"
      [class.hug-img-upload--obrigatorio]="obrigatorio"
      [class.hug-img-upload--invalido]="invalido"
      [class.hug-img-upload--arrastando]="arrastando"
      [class.hug-img-upload--compacta]="compacta">
      <span class="hug-img-upload__rotulo" [id]="rotuloId">
        {{ label }}<span class="hug-img-upload__obrigatorio" *ngIf="obrigatorio" aria-hidden="true"> *</span>
      </span>
      <div
        class="hug-img-upload__corpo"
        (dragover)="aoArrastar($event)"
        (dragleave)="aoSairArraste($event)"
        (drop)="aoSoltar($event)">
        <app-hug-file-preview
          [previewUrl]="previewUrl"
          [tipoPreview]="tipoPreview"
          [nomeArquivo]="nomeArquivo"
          [alt]="label"
          [layout]="layout"
          [iconePlaceholder]="iconeZona"
          [tituloVazio]="tituloVazio"
          [disabled]="disabled"
          [somenteLeitura]="somenteLeitura"
          [carregando]="carregando"
          [exibirVisualizar]="exibirVisualizar"
          [exibirBaixar]="exibirBaixar"
          [exibirSubstituir]="exibirSubstituir"
          [exibirRemover]="exibirRemover"
          [arrastando]="arrastando"
          [preencherLargura]="varianteCard"
          [alinharAlturaPar]="varianteCard"
          [compacta]="compacta"
          [attr.aria-labelledby]="rotuloId"
          (acaoSubstituir)="abrirSeletor()"
          (acaoVisualizar)="abrirVisualizacao()"
          (acaoBaixar)="solicitarBaixar()"
          (acaoRemover)="remover()" />
        <p class="hug-img-upload__meta">{{ linhaMeta }}</p>
      </div>
      <input
        #arquivo
        type="file"
        class="hug-img-upload__input"
        [accept]="accept"
        [disabled]="bloquearEdicao"
        (change)="aoArquivo($event)" />
      <span class="hug-img-upload__erro" *ngIf="erro" role="alert">{{ erro }}</span>
    </div>
    @if (visualizacaoAberta && previewUrl && tipoPreview) {
      <app-modal-arquivo-visualizacao
        [url]="previewUrl"
        [titulo]="label"
        [nomeArquivo]="nomeArquivo"
        [tipo]="tipoPreview"
        [exibirBaixar]="exibirBaixar"
        (fechar)="visualizacaoAberta = false"
        (baixar)="baixar.emit()" />
    }
  `,
})
export class HugFileUploadComponent {
  @Input() label = 'Arquivo';
  @Input() previewUrl: string | null = null;
  /** MIME do arquivo em prévia (local ou vindo da API). */
  @Input() previewMime: string | null = null;
  @Input() nomeArquivo: string | null = null;
  @Input() disabled = false;
  @Input() somenteLeitura = false;
  @Input() carregando = false;
  @Input() obrigatorio = false;
  @Input() invalido = false;
  @Input() exibirVisualizar = true;
  @Input() exibirBaixar = false;
  @Input() exibirSubstituir = true;
  @Input() exibirRemover = true;
  @Input() maxMb = 5;
  @Input() accept = 'application/pdf,image/jpeg,image/png';
  @Input() metaFormatos = 'Formatos: PDF, JPG ou PNG';
  @Input() dimensaoRecomendada = '';
  @Input() layout: HugImageLayout = 'paisagem';
  @Input() iconeZona = 'file-text';
  @Input() varianteCard = false;
  /** Prévia em cartão horizontal, sem miniatura grande (ideal para anexos em formulários). */
  @Input() compacta = false;
  /** Quando true, comportamento estritamente de imagem (Configuração do Condomínio). */
  @Input() modoImagem = false;

  @Output() arquivoSelecionado = new EventEmitter<File>();
  @Output() removido = new EventEmitter<void>();
  @Output() baixar = new EventEmitter<void>();

  @ViewChild('arquivo') private arquivo?: ElementRef<HTMLInputElement>;

  readonly rotuloId = `hug-file-upload-${HugFileUploadComponent.proximoId++}`;

  erro = '';
  arrastando = false;
  visualizacaoAberta = false;

  private static proximoId = 0;

  get tituloVazio(): string {
    return this.modoImagem ? 'Nenhuma imagem' : 'Nenhum arquivo';
  }

  get linhaMeta(): string {
    const partes = [this.metaFormatos, `Máx. ${this.maxMb} MB`];
    if (this.dimensaoRecomendada) {
      partes.push(`Recomendado: ${this.dimensaoRecomendada}`);
    }
    return partes.join(' • ');
  }

  get tipoPreview(): HugArquivoPreviewTipo | null {
    if (!this.previewUrl) return null;
    if (this.modoImagem) return 'imagem';
    return classificarArquivoPreview(this.previewMime, this.nomeArquivo);
  }

  get bloquearEdicao(): boolean {
    return this.disabled || this.somenteLeitura || this.carregando;
  }

  @HostListener('document:keydown.escape')
  fecharVisualizacao(): void {
    this.visualizacaoAberta = false;
  }

  abrirSeletor(): void {
    if (this.bloquearEdicao) return;
    this.arquivo?.nativeElement.click();
  }

  abrirVisualizacao(): void {
    if (!this.previewUrl || !this.tipoPreview) return;
    this.visualizacaoAberta = true;
  }

  solicitarBaixar(): void {
    this.baixar.emit();
    if (!this.previewUrl) return;
    const link = document.createElement('a');
    link.href = this.previewUrl;
    link.download = this.nomeArquivo?.trim() || 'arquivo';
    link.rel = 'noopener';
    link.click();
  }

  aoArrastar(ev: DragEvent): void {
    if (this.bloquearEdicao) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.arrastando = true;
  }

  aoSairArraste(ev: DragEvent): void {
    ev.preventDefault();
    this.arrastando = false;
  }

  aoSoltar(ev: DragEvent): void {
    if (this.bloquearEdicao) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.arrastando = false;
    const file = ev.dataTransfer?.files?.[0];
    if (file) this.processarArquivo(file);
  }

  aoArquivo(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.processarArquivo(file);
  }

  remover(): void {
    if (this.bloquearEdicao) return;
    this.erro = '';
    this.visualizacaoAberta = false;
    this.removido.emit();
  }

  private processarArquivo(file: File): void {
    this.erro = '';
    if (!arquivoAceitoPeloAccept(file, this.accept)) {
      this.erro = 'Formato de arquivo não permitido.';
      return;
    }
    if (file.size > this.maxMb * 1024 * 1024) {
      this.erro = `Arquivo excede ${this.maxMb} MB.`;
      return;
    }
    this.arquivoSelecionado.emit(file);
  }
}
