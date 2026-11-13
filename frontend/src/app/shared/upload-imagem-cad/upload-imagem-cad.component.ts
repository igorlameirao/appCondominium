import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HugImageUploadComponent, HugImageLayout } from '../hug-image-upload/hug-image-upload.component';

/** @deprecated Preferir `app-hug-image-upload` (Hug). Mantido para compatibilidade. */
@Component({
  selector: 'app-upload-imagem-cad',
  standalone: true,
  imports: [HugImageUploadComponent],
  template: `
    <app-hug-image-upload
      [label]="label"
      [previewUrl]="previewUrl"
      [disabled]="disabled"
      [somenteLeitura]="somenteLeitura"
      [carregando]="carregando"
      [obrigatorio]="obrigatorio"
      [invalido]="invalido"
      [exibirVisualizar]="exibirVisualizar"
      [exibirSubstituir]="exibirSubstituir"
      [exibirRemover]="exibirRemover"
      [maxMb]="maxMb"
      [accept]="accept"
      [metaFormatos]="metaFormatos"
      [dimensaoRecomendada]="dimensaoRecomendada"
      [layout]="layout"
      [iconeZona]="iconeZona"
      (arquivoSelecionado)="arquivoSelecionado.emit($event)"
      (removido)="removido.emit()" />
  `,
})
export class UploadImagemCadComponent {
  @Input() label = 'Imagem';
  @Input() previewUrl: string | null = null;
  @Input() disabled = false;
  @Input() somenteLeitura = false;
  @Input() carregando = false;
  @Input() obrigatorio = false;
  @Input() invalido = false;
  @Input() exibirVisualizar = true;
  @Input() exibirSubstituir = true;
  @Input() exibirRemover = true;
  @Input() maxMb = 5;
  @Input() accept = 'image/png,image/jpeg,image/webp';
  @Input() metaFormatos = 'Formatos: JPG, PNG ou WEBP';
  @Input() dimensaoRecomendada = '1920 × 1080';
  @Input() layout: HugImageLayout = 'paisagem';
  @Input() iconeZona = 'image';

  @Output() arquivoSelecionado = new EventEmitter<File>();
  @Output() removido = new EventEmitter<void>();
}
