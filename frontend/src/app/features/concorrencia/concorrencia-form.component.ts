import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { ConcorrenciaService } from './concorrencia.service';
import { Concorrencia } from './concorrencia.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { TipoDespesaService } from '../tipodespesa/tipodespesa.service';

@Component({
  selector: 'app-concorrencia-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/concorrencia'">Concorrência</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Concorrência</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de concorrência</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="file-text" [tamanho]="16" />
              <span>Dados da Concorrência</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="file-text" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da Concorrência</h2>
                <p class="cad-secao__texto">Informe a descrição, classificação e prazos da concorrência</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                @if (isEdit) {
                  <input
                    type="hidden"
                    [(ngModel)]="model.idConcorrencia"
                    name="idConcorrencia" />
                }

                <div class="cad-blocos concorrencia-dados">
                  <div class="form-grid concorrencia-dados__linha concorrencia-dados__linha--1">
                    <div class="form-group concorrencia-dados__campo">
                      <label for="concorrencia-descricao">Descrição *</label>
                      <textarea
                        id="concorrencia-descricao"
                        class="input-textarea"
                        [(ngModel)]="model.descricao"
                        name="descricao"
                        rows="2"
                        [readonly]="fieldDisabled('descricao')"
                        required></textarea>
                    </div>
                  </div>
                  <div class="form-grid concorrencia-dados__linha concorrencia-dados__linha--2">
                    <div class="form-group concorrencia-dados__campo">
                      <label>Tipo de Despesa *</label>
                      <app-combobox-customizada
                        [options]="fk_idTipoDespesa"
                        [(value)]="model.idTipoDespesa"
                        [disabled]="fieldDisabled('idTipoDespesa')"
                        [required]="true"
                        ariaLabel="Tipo de Despesa" />
                    </div>
                    <div class="form-group concorrencia-dados__campo">
                      <label for="concorrencia-tipo">Tipo de Concorrência *</label>
                      <select
                        id="concorrencia-tipo"
                        [(ngModel)]="model.tipoConcorrencia"
                        name="tipoConcorrencia"
                        [disabled]="fieldDisabled('tipoConcorrencia')"
                        required>
                        <option [ngValue]="null">Selecione…</option>
                        <option [ngValue]="0">Preço</option>
                        <option [ngValue]="1">Qualidade</option>
                        <option [ngValue]="2">Prazo Entrega</option>
                        <option [ngValue]="3">Capacidade Técnica</option>
                      </select>
                    </div>
                    <div class="form-group concorrencia-dados__campo">
                      <label for="concorrencia-fase">Fase *</label>
                      <select
                        id="concorrencia-fase"
                        [(ngModel)]="model.fase"
                        name="fase"
                        [disabled]="fieldDisabled('fase')"
                        required>
                        <option [ngValue]="null">Selecione…</option>
                        <option [ngValue]="0">Divulgação</option>
                        <option [ngValue]="1">Recebimento Proposta</option>
                        <option [ngValue]="2">Análise</option>
                        <option [ngValue]="3">Escolha Vencedor</option>
                        <option [ngValue]="4">Assinatura Contrato</option>
                        <option [ngValue]="5">Finalizado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="calendar" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Prazos da Concorrência</h2>
                  </div>
                </div>

                <div class="cad-blocos concorrencia-prazos">
                  <div class="form-grid concorrencia-prazos__linha">
                    <div class="form-group concorrencia-prazos__campo">
                      <label>Data de Abertura *</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataAbertura"
                        name="dataAbertura"
                        [disabled]="fieldDisabled('dataAbertura')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group concorrencia-prazos__campo">
                      <label>Previsão de Encerramento *</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataPrevistaEncerramento"
                        name="dataPrevistaEncerramento"
                        [disabled]="fieldDisabled('dataPrevistaEncerramento')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group concorrencia-prazos__campo">
                      <label>Encerramento</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataEncerramento"
                        name="dataEncerramento"
                        [disabled]="fieldDisabled('dataEncerramento')"
                        [feedbackVisual]="true" />
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
    <app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />
  `,
  styles: [`
    .concorrencia-dados,
    .concorrencia-prazos {
      gap: 12px;
    }
    .concorrencia-dados__linha--1 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .concorrencia-dados__linha--2 {
      grid-template-columns: minmax(0, 40fr) minmax(0, 35fr) minmax(0, 25fr);
      align-items: end;
    }
    .concorrencia-dados__campo,
    .concorrencia-prazos__campo {
      min-width: 0;
    }
    .concorrencia-prazos__linha {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: end;
      gap: 10px;
    }
    .concorrencia-prazos__campo > label {
      display: block;
      min-height: 2.5em;
      line-height: 1.25;
    }
  @media (max-width: 720px) {
      .concorrencia-dados__linha--2,
      .concorrencia-prazos__linha {
        grid-template-columns: minmax(0, 1fr);
      }
      .concorrencia-prazos__campo > label {
        min-height: 0;
      }
    }
  `],
})
export class ConcorrenciaFormComponent implements OnInit {
  model: Concorrencia = {} as Concorrencia;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Concorrência';
  showDeleteConfirm = false;
  readonly permissionKey = 'CONCORRENCIA';
  canEdit = true;
  canDelete = true;
  fk_idTipoDespesa: ComboboxOption[] = [];

  constructor(
    private service: ConcorrenciaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private tipoDespesaService: TipoDespesaService,
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

    
    this.pageLoad.run(this.tipoDespesaService.getPaged(1, 200), r => {
      this.fk_idTipoDespesa = r.items.map((x: any) => ({
        value: x.idTipoDespesa,
        label: this.fkLabel_idTipoDespesa(x)
      }));
    });
    const idConcorrencia = this.route.snapshot.paramMap.get('idConcorrencia');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idConcorrencia) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idConcorrencia), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/concorrencia']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/concorrencia']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/concorrencia']); }

  confirmDelete(): void {
    this.service.delete(this.model.idConcorrencia!).subscribe({ next: () => this.router.navigate(['/concorrencia']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idTipoDespesa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idTipoDespesa ?? '');
  }
}
