import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { CampoMoedaComponent } from '../../shared/campo-moeda/campo-moeda.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AluguelEquipamentoService } from './aluguelequipamento.service';
import { AluguelEquipamento } from './aluguelequipamento.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';
import { EquipamentoService } from '../equipamento/equipamento.service';

@Component({
  selector: 'app-aluguelequipamento-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, CampoMoedaComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/aluguelequipamento'">Aluguel de Equipamento</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Aluguel de Equipamento</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de aluguel de equipamento</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados de Aluguel de Equipamento</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de Aluguel de Equipamento</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <input
                  *ngIf="isEdit"
                  type="hidden"
                  name="idAluguelEquipamento"
                  [(ngModel)]="model.idAluguelEquipamento" />

                <div class="cad-blocos ae-cad">
                  <div class="form-grid ae-cad__linha ae-cad__linha--1">
                    <div class="form-group ae-cad__campo">
                      <label>Unidade *</label>
                      <app-combobox-customizada
                        [options]="fk_idUnidade"
                        [(value)]="model.idUnidade"
                        [disabled]="fieldDisabled('idUnidade')"
                        [required]="true"
                        ariaLabel="Unidade" />
                    </div>
                    <div class="form-group ae-cad__campo">
                      <label>Equipamento *</label>
                      <app-combobox-customizada
                        [options]="fk_idEquipamento"
                        [(value)]="model.idEquipamento"
                        [disabled]="fieldDisabled('idEquipamento')"
                        [required]="true"
                        ariaLabel="Equipamento" />
                    </div>
                  </div>

                  <div class="form-grid ae-cad__linha ae-cad__linha--2">
                    <div class="form-group ae-cad__campo ae-cad__datahora">
                      <label>Data Início</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataInicio"
                        name="dataInicio"
                        [disabled]="fieldDisabled('dataInicio')"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group ae-cad__campo ae-cad__datahora">
                      <label>Data Fim</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataFim"
                        name="dataFim"
                        [disabled]="fieldDisabled('dataFim')"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group ae-cad__campo ae-cad__moeda">
                      <label>Valor</label>
                      <app-campo-moeda
                        [(ngModel)]="model.valor"
                        name="valor"
                        modo="numero"
                        [readonly]="fieldDisabled('valor')"
                        [disabled]="fieldDisabled('valor')" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
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
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." />
  `,
  styles: [`
    .ae-cad {
      gap: 12px;
    }
    .ae-cad__linha--1 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .ae-cad__linha--2 {
      grid-template-columns: minmax(0, 30fr) minmax(0, 30fr) minmax(0, 40fr);
      align-items: end;
    }
    .ae-cad__campo,
    .ae-cad__datahora,
    .ae-cad__moeda {
      min-width: 0;
    }
    .ae-cad__moeda > label,
    .ae-cad__datahora > label {
      line-height: 1.25;
    }
    @media (max-width: 720px) {
      .ae-cad__linha--1,
      .ae-cad__linha--2 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class AluguelEquipamentoFormComponent implements OnInit, OnDestroy {
  model: AluguelEquipamento = {} as AluguelEquipamento;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Aluguel de Equipamento';
  showDeleteConfirm = false;
  readonly permissionKey = 'ALUGUELEQUIPAMENTO';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idEquipamento: ComboboxOption[] = [];

  constructor(
    private service: AluguelEquipamentoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
    private equipamentoService: EquipamentoService,
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
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    const idAluguelEquipamento = this.route.snapshot.paramMap.get('idAluguelEquipamento');
    if (!isNovo && idAluguelEquipamento) {
      this.pageLoad.beginEdit();
    }

    this.pageLoad.run(this.unidadeService.getPaged(1, 200), r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.pageLoad.run(this.equipamentoService.getPaged(1, 200), r => {
      this.fk_idEquipamento = r.items.map((x: any) => ({
        value: x.idEquipamento,
        label: this.fkLabel_idEquipamento(x)
      }));
    });

    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      this.pageLoad.seal();
      return;
    }
    if (idAluguelEquipamento) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(
        this.service.getById(idAluguelEquipamento),
        (r) => { this.model = r; },
        () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  ngOnDestroy(): void {
    this.pageLoad.loading = false;
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/aluguelequipamento']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/aluguelequipamento']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/aluguelequipamento']); }

  confirmDelete(): void {
    this.service.delete(this.model.idAluguelEquipamento!).subscribe({ next: () => this.router.navigate(['/aluguelequipamento']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idEquipamento(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idEquipamento ?? '');
  }
}
