import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagem-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="img-upload">
      <label class="img-upload__label">{{ label }}</label>
      <div class="img-upload__preview" *ngIf="previewSrc">
        <img [src]="previewSrc" [alt]="label" />
        <button type="button" class="img-upload__remove" (click)="remover()" *ngIf="!disabled">Remover</button>
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        (change)="onFile($event)"
        [disabled]="disabled" />
      <span class="img-upload__hint">PNG, JPG ou WEBP — máx. {{ maxMb }} MB</span>
      <span class="img-upload__erro" *ngIf="erro">{{ erro }}</span>
    </div>
  `,
  styles: [`
    .img-upload { display: flex; flex-direction: column; gap: 8px; }
    .img-upload__label { font-weight: 600; font-size: 13px; color: #334155; }
    .img-upload__preview {
      position: relative; display: inline-block; max-width: 280px;
      border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc;
    }
    .img-upload__preview img { display: block; max-width: 100%; max-height: 160px; object-fit: contain; }
    .img-upload__remove {
      position: absolute; top: 6px; right: 6px; background: rgba(15,23,42,.75); color: #fff;
      border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;
    }
    .img-upload__hint { font-size: 12px; color: #64748b; }
    .img-upload__erro { font-size: 12px; color: #dc3545; }
  `]
})
export class ImagemUploadComponent {
  @Input() label = 'Imagem';
  @Input() value: string | null | undefined = null;
  @Input() disabled = false;
  @Input() maxMb = 3;
  @Output() valueChange = new EventEmitter<string | null>();

  erro = '';

  get previewSrc(): string | null {
    if (!this.value) return null;
    if (this.value.startsWith('data:')) return this.value;
    return `data:image/png;base64,${this.value}`;
  }

  onFile(ev: Event): void {
    this.erro = '';
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > this.maxMb * 1024 * 1024) {
      this.erro = `Arquivo excede ${this.maxMb} MB.`;
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      this.value = base64;
      this.valueChange.emit(base64);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  remover(): void {
    this.value = null;
    this.valueChange.emit(null);
    this.erro = '';
  }
}
