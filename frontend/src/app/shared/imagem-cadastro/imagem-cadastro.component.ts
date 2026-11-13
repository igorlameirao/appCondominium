import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampoInformativoComponent } from '../campo-informativo/campo-informativo.component';

/** Campo de imagem no padrão `.imagem-cadastro*` (S3 via API multipart). */
@Component({
  selector: 'app-imagem-cadastro',
  standalone: true,
  imports: [CommonModule, CampoInformativoComponent],
  template: `
    <div class="imagem-cadastro">
      <div class="imagem-cadastro__rotulo">
        <span>{{ label }}</span>
        <app-campo-informativo *ngIf="infoTexto" [texto]="infoTexto" />
      </div>
      <div class="imagem-cadastro__preview" [class.imagem-cadastro__preview--vazia]="!previewUrl">
        <img *ngIf="previewUrl" [src]="previewUrl" [alt]="label" />
        <span *ngIf="!previewUrl" class="imagem-cadastro__vazio">Nenhuma imagem</span>
      </div>
      <div class="imagem-cadastro__acoes">
        <label class="btn-secondary imagem-cadastro__btn-arquivo" [class.disabled]="disabled">
          Selecionar imagem
          <input
            class="imagem-cadastro__arquivo"
            type="file"
            [accept]="accept"
            [disabled]="disabled"
            (change)="onFile($event)" />
        </label>
        <button type="button" class="btn-secondary" *ngIf="previewUrl" [disabled]="disabled" (click)="removido.emit()">
          Remover
        </button>
      </div>
      <p class="imagem-cadastro__aviso">PNG, JPG ou WEBP — máx. {{ maxMb }} MB</p>
      <p class="imagem-cadastro__erro field-error" *ngIf="erro">{{ erro }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; width: 100%; }
    .imagem-cadastro__btn-arquivo {
      display: inline-flex;
      align-items: center;
      margin: 0;
      cursor: pointer;
    }
    .imagem-cadastro__btn-arquivo.disabled {
      opacity: 0.55;
      pointer-events: none;
    }
  `]
})
export class ImagemCadastroComponent {
  @Input() label = 'Imagem';
  @Input() infoTexto = '';
  @Input() previewUrl: string | null = null;
  @Input() accept = 'image/png,image/jpeg,image/webp';
  @Input() disabled = false;
  @Input() maxMb = 5;
  @Output() arquivoSelecionado = new EventEmitter<File>();
  @Output() removido = new EventEmitter<void>();

  erro = '';

  onFile(ev: Event): void {
    this.erro = '';
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > this.maxMb * 1024 * 1024) {
      this.erro = `Arquivo excede ${this.maxMb} MB.`;
      return;
    }
    this.arquivoSelecionado.emit(file);
  }
}
