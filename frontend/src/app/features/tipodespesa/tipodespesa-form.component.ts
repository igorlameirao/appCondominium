import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { TipoDespesaService } from './tipodespesa.service';
import { TipoDespesa } from './tipodespesa.model';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';


@Component({
  selector: 'app-tipodespesa-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/tipodespesa'">Tipo de Despesa</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Tipo de Despesa</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de tipo de despesa</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Tipo de Despesa</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="form-scroll cad-form-scroll"><form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
              <div class="cad-blocos tipodespesa-dados">
                <div class="form-grid tipodespesa-dados__linha">
                  <div class="form-group tipodespesa-dados__descricao">
                    <label for="td-descricao">Descrição *</label>
                    <input
                      id="td-descricao"
                      type="text"
                      [(ngModel)]="model.descricao"
                      name="descricao"
                      maxlength="255"
                      [readonly]="fieldDisabled('descricao')"
                      required />
                  </div>
                  <div class="form-group tipodespesa-dados__codigo">
                    <label for="td-codigo-contabil">Código Contábil</label>
                    <input
                      id="td-codigo-contabil"
                      type="text"
                      [(ngModel)]="model.codigoContabil"
                      name="codigoContabil"
                      maxlength="50"
                      [readonly]="fieldDisabled('codigoContabil')" />
                  </div>
                  <div class="form-group tipodespesa-dados__rateio">
                    <label for="td-tipo-rateio">Tipo de Rateio *</label>
                    <select
                      id="td-tipo-rateio"
                      [(ngModel)]="model.tipoRateio"
                      name="tipoRateio"
                      [disabled]="fieldDisabled('tipoRateio')"
                      required>
                      <option [ngValue]="null">Selecione…</option>
                      <option [ngValue]="0">Por metro quadrado da unidade</option>
                      <option [ngValue]="1">Pela quantidade de unidades</option>
                    </select>
                  </div>
                </div>
              </div>
            </form></div>
          </div>
          <div class="actions form-actions cad-acoes">
        <button type="submit" class="btn-gravar" form="entityForm" [class.is-loading]="saving" [disabled]="saving || !podeGravar">Salvar</button>
        <span class="cad-acoes__espaco"></span>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
        <button type="button" class="btn-excluir" *ngIf="isEdit && canDelete" (click)="showDeleteConfirm=true">Excluir</button>
      </div>
        </section>
      </div>
    </div>
    <div class="confirm-overlay" *ngIf="showDeleteConfirm">
      <div class="confirm-modal">
        <p>Deseja realmente excluir este registro?</p>
        <div class="confirm-actions">
          <button type="button" class="btn-cancelar-modal" (click)="showDeleteConfirm=false">Cancelar</button>
          <button type="button" class="btn-confirm-danger" (click)="confirmDelete()">Excluir</button>
        </div>
      </div>
    </div>
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />
  `,
  styles: [`
    :host .cad-page {
      max-width: min(1100px, calc(100vw - 40px));
    }
    .tipodespesa-dados {
      gap: 0;
    }
    .tipodespesa-dados__linha {
      grid-template-columns: minmax(0, 48fr) minmax(0, 22fr) minmax(0, 30fr);
      align-items: end;
    }
    .tipodespesa-dados__descricao,
    .tipodespesa-dados__codigo,
    .tipodespesa-dados__rateio {
      min-width: 0;
    }
    @media (max-width: 720px) {
      .tipodespesa-dados__linha {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class TipoDespesaFormComponent implements OnInit {
  model: TipoDespesa = {} as TipoDespesa;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Tipo de Despesa';
  showDeleteConfirm = false;
  readonly permissionKey = 'TIPODESPESA';
  canEdit = true;
  canDelete = true;
  

  constructor(
    private service: TipoDespesaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService
    
  ) {
    this.refreshPermissions();
  }

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  private refreshPermissions(): void {
    this.canEdit = this.podeGravar;
    this.canDelete = this.permissions.can(this.permissionKey, 'Excluir');
  }

  ngOnInit(): void {
    if (!this.route.snapshot.url.some(s => s.path === 'novo')) this.pageLoad.beginEdit();

    
    const idTipoDespesa = this.route.snapshot.paramMap.get('idTipoDespesa');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idTipoDespesa) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idTipoDespesa), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.toast.showError('Preencha os campos obrigatórios antes de gravar.'); return; }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/tipodespesa']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/tipodespesa']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/tipodespesa']); }

  confirmDelete(): void {
    this.service.delete(this.model.idTipoDespesa!).subscribe({ next: () => this.router.navigate(['/tipodespesa']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

}
