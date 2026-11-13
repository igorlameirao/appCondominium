import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { UnidadeService, BlocoComUnidades, CopiarBlocoPrevia } from './unidade.service';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { BlocoService } from '../bloco/bloco.service';

@Component({
  selector: 'app-unidade-copiar-bloco',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, ComboboxCustomizadaComponent],
  styles: [`
    .copia-resumo { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .copia-resumo__secao h3 { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--color-text, #0f172a); }
    .copia-resumo__secao p { margin: 0 0 8px; font-size: 13px; color: var(--cad-muted, #64748b); }
    .copia-resumo__vazio { margin: 0; font-size: 13px; color: var(--cad-muted, #64748b); font-style: italic; }
    .copia-resumo__tabela { width: 100%; border-collapse: collapse; font-size: 13px; }
    .copia-resumo__tabela th,
    .copia-resumo__tabela td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .copia-resumo__tabela th { font-weight: 600; color: #475569; }
  `],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/unidade'">Unidade</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Copiar bloco</span>
          </nav>
          <h1 class="cad-titulo">Copiar unidades entre blocos</h1>
          <p class="cad-subtitulo">Inclui unidades inexistentes no destino e alinha o tipo quando o número já existe com tipo diferente</p>
        </header>

        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="building" [tamanho]="16" />
              <span>Copiar bloco</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="building" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Blocos</h2>
                <p class="cad-secao__texto">Hidrômetro não é copiado nem alterado no destino</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="copiarBlocoForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <div class="form-grid">
                  <div style="grid-column: 1 / span 6; grid-row: 1" class="form-group fg-col-6">
                    <label>Bloco de origem *</label>
                    <app-combobox-customizada
                      [options]="fk_blocoOrigem"
                      [(value)]="idBlocoOrigem"
                      name="idBlocoOrigem"
                      [disabled]="!podeGravar"
                      [required]="true"
                      (valueChange)="onBlocosChange()" />
                  </div>
                  <div style="grid-column: 7 / span 6; grid-row: 1" class="form-group fg-col-6">
                    <label>Bloco de destino *</label>
                    <app-combobox-customizada
                      [options]="fk_blocoDestino"
                      [(value)]="idBlocoDestino"
                      name="idBlocoDestino"
                      [disabled]="!podeGravar"
                      [required]="true"
                      (valueChange)="onBlocosChange()" />
                  </div>
                </div>

                @if (blocosProntos) {
                  <div class="copia-resumo" [attr.aria-busy]="carregandoPrevia">
                    <div class="copia-resumo__secao">
                      <h3>Serão incluídas ({{ previa?.criar?.length ?? 0 }})</h3>
                      <p>Unidades do bloco de origem cujo número ainda não existe no destino.</p>
                      @if (previa?.criar?.length) {
                        <table class="copia-resumo__tabela">
                          <thead>
                            <tr><th scope="col">Número</th><th scope="col">Tipo de unidade</th></tr>
                          </thead>
                          <tbody>
                            @for (linha of previa!.criar; track linha.numero) {
                              <tr>
                                <td>{{ linha.numero ?? '—' }}</td>
                                <td>{{ linha.tipoUnidadeOrigem || linha.idTipoUnidadeOrigem }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      } @else {
                        <p class="copia-resumo__vazio">Nenhuma unidade nova a incluir.</p>
                      }
                    </div>

                    <div class="copia-resumo__secao">
                      <h3>Serão alteradas ({{ previa?.alterar?.length ?? 0 }})</h3>
                      <p>Mesmo número no destino; o tipo de unidade será atualizado para o da origem.</p>
                      @if (previa?.alterar?.length) {
                        <table class="copia-resumo__tabela">
                          <thead>
                            <tr>
                              <th scope="col">Número</th>
                              <th scope="col">Tipo atual no destino</th>
                              <th scope="col">Tipo após cópia</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (linha of previa!.alterar; track linha.numero) {
                              <tr>
                                <td>{{ linha.numero ?? '—' }}</td>
                                <td>{{ linha.tipoUnidadeDestino || linha.idTipoUnidadeDestino }}</td>
                                <td>{{ linha.tipoUnidadeOrigem || linha.idTipoUnidadeOrigem }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      } @else {
                        <p class="copia-resumo__vazio">Nenhuma unidade a alterar.</p>
                      }
                    </div>

                    <div class="copia-resumo__secao">
                      <h3>Não serão copiadas ({{ previa?.ignorar?.length ?? 0 }})</h3>
                      <p>Já existem no destino com o mesmo número e o mesmo tipo de unidade.</p>
                      @if (previa?.ignorar?.length) {
                        <table class="copia-resumo__tabela">
                          <thead>
                            <tr><th scope="col">Número</th><th scope="col">Tipo de unidade</th></tr>
                          </thead>
                          <tbody>
                            @for (linha of previa!.ignorar; track linha.numero) {
                              <tr>
                                <td>{{ linha.numero ?? '—' }}</td>
                                <td>{{ linha.tipoUnidadeOrigem || linha.idTipoUnidadeOrigem }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      } @else {
                        <p class="copia-resumo__vazio">Nenhuma unidade ignorada.</p>
                      }
                    </div>
                  </div>
                }
              </form>
            </div>
          </div>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="copiarBlocoForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar || !podeSalvar">Salvar</button>
            <span class="cad-acoes__espaco"></span>
            <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
          </div>
        </section>
      </div>
    </div>
    <app-list-loading-modal [visible]="pageLoad.loading || saving || carregandoPrevia" message="Aguarde..." [delayMs]="0" />
  `,
})
export class UnidadeCopiarBlocoComponent implements OnInit {
  idBlocoOrigem?: number;
  idBlocoDestino?: number;
  saving = false;
  carregandoPrevia = false;
  previa: CopiarBlocoPrevia | null = null;
  erroPrevia: string | null = null;

  fk_blocoOrigem: ComboboxOption[] = [];
  fk_blocoDestino: ComboboxOption[] = [];
  private todosBlocosDestino: ComboboxOption[] = [];

  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  readonly permissionKey = 'UNIDADE';

  constructor(
    private service: UnidadeService,
    private blocoService: BlocoService,
    private router: Router,
    private permissions: PermissionService,
  ) {}

  get podeGravar(): boolean {
    return this.permissions.can(this.permissionKey, 'Incluir');
  }

  get blocosProntos(): boolean {
    return this.idBlocoOrigem != null
      && this.idBlocoDestino != null
      && this.idBlocoOrigem !== this.idBlocoDestino;
  }

  get podeSalvar(): boolean {
    if (!this.blocosProntos || this.carregandoPrevia || this.erroPrevia) return false;
    if (!this.previa) return false;
    const total = this.previa.criar.length + this.previa.alterar.length;
    return total > 0;
  }

  ngOnInit(): void {
    this.pageLoad.run(this.service.getBlocosComUnidades(), (r) => {
      this.fk_blocoOrigem = r.map((b) => ({ value: b.idBloco, label: this.rotuloBloco(b) }));
    });
    this.pageLoad.run(this.blocoService.getPaged(1, 500), (r) => {
      this.todosBlocosDestino = r.items.map((b) => ({
        value: b.idBloco!,
        label: b.descricao ?? String(b.idBloco),
      }));
      this.atualizarBlocoDestino();
    });
    this.pageLoad.seal();
  }

  onBlocosChange(): void {
    if (this.idBlocoDestino != null && this.idBlocoDestino === this.idBlocoOrigem) {
      this.idBlocoDestino = undefined;
    }
    this.atualizarBlocoDestino();
    this.carregarPrevia();
  }

  private atualizarBlocoDestino(): void {
    if (this.idBlocoOrigem == null) {
      this.fk_blocoDestino = [...this.todosBlocosDestino];
      return;
    }
    this.fk_blocoDestino = this.todosBlocosDestino.filter((o) => o.value !== this.idBlocoOrigem);
  }

  private carregarPrevia(): void {
    this.previa = null;
    this.erroPrevia = null;
    if (!this.blocosProntos) return;

    this.carregandoPrevia = true;
    this.service.previaCopiarBloco(this.idBlocoOrigem!, this.idBlocoDestino!).subscribe({
      next: (p) => {
        this.previa = p;
        this.carregandoPrevia = false;
      },
      error: (e: unknown) => {
        this.carregandoPrevia = false;
        const body = (e as { error?: { message?: string } })?.error;
        this.erroPrevia = typeof body === 'string' ? body : body?.message ?? 'Não foi possível montar o resumo.';
        this.toast.showError(this.erroPrevia);
      },
    });
  }

  private rotuloBloco(b: BlocoComUnidades): string {
    return b.descricao ?? String(b.idBloco);
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    if (!this.blocosProntos) {
      this.toast.showError('Selecione o bloco de origem e o de destino.');
      return;
    }
    if (!this.podeSalvar) {
      this.toast.showError('Não há unidades a incluir ou alterar no destino.');
      return;
    }

    this.saving = true;
    this.service.copiarBloco(this.idBlocoOrigem!, this.idBlocoDestino!).subscribe({
      next: (r) => {
        this.saving = false;
        const partes: string[] = [];
        if (r.criadas > 0) partes.push(`${r.criadas} incluída(s)`);
        if (r.alteradas > 0) partes.push(`${r.alteradas} alterada(s)`);
        if (r.ignoradas > 0) partes.push(`${r.ignoradas} ignorada(s)`);
        this.toast.showSuccess(`Cópia concluída: ${partes.join('; ')}.`);
        this.router.navigate(['/unidade']);
      },
      error: (e: unknown) => {
        this.saving = false;
        const body = (e as { error?: { message?: string; title?: string } })?.error;
        const msg = typeof body === 'string' ? body : body?.message ?? body?.title
          ?? 'Não foi possível copiar as unidades. Tente novamente.';
        this.toast.showError(msg);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/unidade']);
  }
}
