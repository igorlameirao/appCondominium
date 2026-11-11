import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Anexo enviado à API (multipart), sem gravar base64 no JSON da entidade. */
@Component({
  selector: 'app-arquivo-anexo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="arquivo-anexo">
      <span class="arquivo-anexo__label">{{ label }}</span>
      <img *ngIf="modo === 'imagem' && previewUrl" class="arquivo-anexo__preview" [src]="previewUrl" [alt]="label" />
      <span class="arquivo-anexo__nome" *ngIf="modo === 'arquivo' && nomeArquivo">{{ nomeArquivo }}</span>
      <div class="arquivo-anexo__acoes">
        <input type="file" [accept]="accept" (change)="onFile($event)" [disabled]="disabled" />
        <button type="button" *ngIf="podeRemover" (click)="removido.emit()" [disabled]="disabled">Remover</button>
      </div>
      <span class="arquivo-anexo__hint">Máx. {{ maxMb }} MB</span>
      <span class="arquivo-anexo__erro" *ngIf="erro">{{ erro }}</span>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .arquivo-anexo { display: flex; flex-direction: column; gap: 8px; }
    .arquivo-anexo__label { font-weight: 600; font-size: 13px; color: #334155; }
    .arquivo-anexo__preview { max-width: 280px; max-height: 160px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .arquivo-anexo__nome { font-size: 13px; color: #0f172a; }
    .arquivo-anexo__acoes { display: flex; gap: 8px; align-items: center; }
    .arquivo-anexo__hint { font-size: 12px; color: #64748b; }
    .arquivo-anexo__erro { font-size: 12px; color: #dc3545; }
  `]
})
export class ArquivoAnexoComponent {
  @Input() label = 'Arquivo';
  @Input() previewUrl: string | null = null;
  @Input() nomeArquivo: string | null = null;
  @Input() accept = 'image/png,image/jpeg,image/webp';
  @Input() disabled = false;
  @Input() maxMb = 5;
  @Input() modo: 'imagem' | 'arquivo' = 'imagem';
  @Output() arquivoSelecionado = new EventEmitter<File>();
  @Output() removido = new EventEmitter<void>();

  erro = '';

  get podeRemover(): boolean {
    return !!this.previewUrl || !!this.nomeArquivo;
  }

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
