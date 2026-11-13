import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HugFileUploadComponent } from '../hug-file-upload/hug-file-upload.component';
import type { HugImageLayout } from './hug-image-layout';

export type { HugImageLayout };

/** Wrapper de compatibilidade — upload exclusivamente de imagem. Implementação em `app-hug-file-upload`. */
@Component({
  selector: 'app-hug-image-upload',
  standalone: true,
  imports: [HugFileUploadComponent],
  template: `
    <app-hug-file-upload
      [modoImagem]="true"
      [label]="label"
      [previewUrl]="previewUrl"
      [previewMime]="previewMime"
      [nomeArquivo]="nomeArquivo"
      [disabled]="disabled"
      [somenteLeitura]="somenteLeitura"
      [carregando]="carregando"
      [obrigatorio]="obrigatorio"
      [invalido]="invalido"
      [exibirVisualizar]="exibirVisualizar"
      [exibirBaixar]="exibirBaixar"
      [exibirSubstituir]="exibirSubstituir"
      [exibirRemover]="exibirRemover"
      [maxMb]="maxMb"
      [accept]="accept"
      [metaFormatos]="metaFormatos"
      [dimensaoRecomendada]="dimensaoRecomendada"
      [layout]="layout"
      [iconeZona]="iconeZona"
      [varianteCard]="varianteCard"
      (arquivoSelecionado)="arquivoSelecionado.emit($event)"
      (removido)="removido.emit()"
      (baixar)="baixar.emit()" />
  `,
})
export class HugImageUploadComponent {
  @Input() label = 'Imagem';
  @Input() previewUrl: string | null = null;
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
  @Input() accept = 'image/png,image/jpeg,image/webp';
  @Input() metaFormatos = 'Formatos: JPG, PNG ou WEBP';
  @Input() dimensaoRecomendada = '1920 × 1080';
  @Input() layout: HugImageLayout = 'paisagem';
  @Input() iconeZona = 'image';
  @Input() varianteCard = false;

  @Output() arquivoSelecionado = new EventEmitter<File>();
  @Output() removido = new EventEmitter<void>();
  @Output() baixar = new EventEmitter<void>();
}
