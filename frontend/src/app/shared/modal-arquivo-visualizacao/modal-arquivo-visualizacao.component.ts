import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { Icone } from '../icone';
import type { HugArquivoPreviewTipo } from '../hug-file-upload/hug-arquivo.util';

@Component({
  selector: 'app-modal-arquivo-visualizacao',
  standalone: true,
  imports: [Icone],
  template: `
    <div class="confirm-overlay cad-modal-imagem" role="dialog" aria-modal="true" [attr.aria-label]="tituloModal" (click)="fechar.emit()">
      <div
        class="cad-dialog cad-modal-imagem__painel cad-modal-arquivo__painel"
        [class.cad-modal-arquivo__painel--pdf]="tipo === 'pdf'"
        (click)="$event.stopPropagation()">
        <header class="cad-modal-imagem__cabecalho cad-modal-arquivo__cabecalho">
          <div class="cad-modal-arquivo__titulos">
            <h2 class="cad-modal-imagem__titulo">{{ titulo }}</h2>
            @if (nomeArquivoExibicao) {
              <p class="cad-modal-arquivo__nome">{{ nomeArquivoExibicao }}</p>
            }
          </div>
          <div class="cad-modal-arquivo__acoes" role="toolbar" aria-label="Ações do arquivo">
            @if (exibirBaixar) {
              <button type="button" class="cad-modal-arquivo__acao" title="Baixar" aria-label="Baixar arquivo" (click)="baixarArquivo()">
                <app-icone nome="download" [tamanho]="16" />
                <span>Baixar</span>
              </button>
            }
            <button type="button" class="cad-modal-arquivo__acao" title="Abrir em nova aba" aria-label="Abrir em nova aba" (click)="abrirNovaAba()">
              <app-icone nome="external-link" [tamanho]="16" />
              <span>Nova aba</span>
            </button>
            <button type="button" class="cad-modal-imagem__fechar" (click)="fechar.emit()" aria-label="Fechar visualização">
              <app-icone nome="x" [tamanho]="18" />
            </button>
          </div>
        </header>
        <div
          class="cad-modal-imagem__corpo cad-modal-arquivo__corpo"
          [class.cad-modal-arquivo__corpo--pdf]="tipo === 'pdf'"
          [class.cad-modal-arquivo__corpo--imagem]="tipo === 'imagem'">
          @if (tipo === 'pdf') {
            <iframe class="cad-modal-arquivo__iframe" [src]="urlSegura" [title]="tituloModal"></iframe>
            <p class="cad-modal-arquivo__dica-incorporacao">
              Se o PDF não aparecer,
              <button type="button" class="cad-modal-arquivo__dica-link" (click)="abrirNovaAba()">abrir em nova aba</button>.
            </p>
          } @else {
            <img class="cad-modal-arquivo__imagem" [src]="url" [alt]="tituloModal" />
          }
        </div>
      </div>
    </div>
  `,
})
export class ModalArquivoVisualizacaoComponent {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() url = '';
  @Input() titulo = 'Visualizar arquivo';
  @Input() nomeArquivo: string | null = null;
  @Input() tipo: HugArquivoPreviewTipo = 'imagem';
  @Input() exibirBaixar = true;
  @Output() fechar = new EventEmitter<void>();
  @Output() baixar = new EventEmitter<void>();

  get tituloModal(): string {
    return this.titulo?.trim() || 'Visualizar arquivo';
  }

  get nomeArquivoExibicao(): string {
    return (this.nomeArquivo || '').trim();
  }

  get urlSegura(): SafeResourceUrl {
    if (!this.url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
  }

  abrirNovaAba(): void {
    if (!this.url) return;
    window.open(this.url, '_blank', 'noopener,noreferrer');
  }

  baixarArquivo(): void {
    this.baixar.emit();
    if (!this.url) return;
    const link = document.createElement('a');
    link.href = this.url;
    link.download = this.nomeArquivoExibicao || 'arquivo';
    link.rel = 'noopener';
    link.click();
  }
}
