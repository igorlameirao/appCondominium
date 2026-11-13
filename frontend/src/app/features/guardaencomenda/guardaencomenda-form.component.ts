import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { GuardaEncomendaService } from './guardaencomenda.service';
import { GuardaEncomenda } from './guardaencomenda.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { UnidadeService } from '../unidade/unidade.service';
import { LocalService } from '../local/local.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';

@Component({
  selector: 'app-guardaencomenda-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/guardaencomenda'">Guarda Encomenda</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Guarda Encomenda</h1>
          <p class="cad-subtitulo">Registre o recebimento, armazenamento e retirada de encomendas</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="clipboard-list" [tamanho]="16" />
              <span>Guarda Encomenda</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="clipboard-list" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da Encomenda</h2>
                <p class="cad-secao__texto">Código, unidade e local onde a encomenda será armazenada</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                <input
                  *ngIf="isEdit"
                  type="hidden"
                  name="idGuardaEncomenda"
                  [(ngModel)]="model.idGuardaEncomenda" />

                <div class="cad-blocos ge-cad">
                  <div class="form-grid ge-cad__linha ge-cad__linha--dados">
                    <div class="form-group ge-cad__campo">
                      <label for="ge-codigo-encomenda">Código da Encomenda *</label>
                      <input
                        id="ge-codigo-encomenda"
                        type="text"
                        [(ngModel)]="model.codigoEncomenda"
                        name="codigoEncomenda"
                        maxlength="255"
                        [readonly]="fieldDisabled('codigoEncomenda')"
                        required />
                    </div>
                    <div class="form-group ge-cad__campo">
                      <label>Unidade *</label>
                      <app-combobox-customizada
                        [options]="fk_idUnidade"
                        [(value)]="model.idUnidade"
                        [disabled]="fieldDisabled('idUnidade')"
                        [required]="true"
                        ariaLabel="Unidade" />
                    </div>
                  </div>
                  <div class="form-grid ge-cad__linha ge-cad__linha--unica">
                    <div class="form-group ge-cad__campo">
                      <label>Local de Armazenamento</label>
                      <app-combobox-customizada
                        [options]="fk_idLocal"
                        [(value)]="model.idLocal"
                        [disabled]="fieldDisabled('idLocal')"
                        ariaLabel="Local de Armazenamento" />
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="download" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Recebimento</h2>
                  </div>
                </div>

                <div class="cad-blocos ge-cad">
                  <div class="form-grid ge-cad__linha ge-cad__linha--fluxo">
                    <div class="form-group ge-cad__campo">
                      <label>Colaborador Responsável *</label>
                      <app-combobox-customizada
                        [options]="fk_idPessoaEntrada"
                        [(value)]="model.idPessoaEntrada"
                        [disabled]="fieldDisabled('idPessoaEntrada')"
                        [required]="true"
                        ariaLabel="Colaborador Responsável" />
                    </div>
                    <div class="form-group ge-cad__campo ge-cad__datahora">
                      <label>Data/Hora de Entrada *</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataHoraEntrada"
                        name="dataHoraEntrada"
                        [disabled]="fieldDisabled('dataHoraEntrada')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                  </div>
                </div>

                <div class="cad-secao cad-secao--apos">
                  <app-icone class="cad-secao__icone" nome="upload" [tamanho]="26" />
                  <div>
                    <h2 class="cad-secao__titulo">Retirada da Encomenda</h2>
                  </div>
                </div>

                <div class="cad-blocos ge-cad">
                  <div class="form-grid ge-cad__linha ge-cad__linha--fluxo">
                    <div class="form-group ge-cad__campo">
                      <label>Retirado Por</label>
                      <app-combobox-customizada
                        [options]="fk_idPessoaSaida"
                        [(value)]="model.idPessoaSaida"
                        [disabled]="fieldDisabled('idPessoaSaida')"
                        ariaLabel="Retirado Por" />
                    </div>
                    <div class="form-group ge-cad__campo ge-cad__datahora">
                      <label>Data/Hora de Saída</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataHoraSaida"
                        name="dataHoraSaida"
                        [disabled]="fieldDisabled('dataHoraSaida')"
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
    .ge-cad {
      gap: 12px;
    }
    .ge-cad__linha--dados {
      grid-template-columns: minmax(0, 40fr) minmax(0, 60fr);
      align-items: end;
    }
    .ge-cad__linha--fluxo {
      grid-template-columns: minmax(0, 65fr) minmax(13.25rem, 35fr);
      align-items: end;
    }
    .ge-cad__linha--unica {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .ge-cad__campo,
    .ge-cad__datahora {
      min-width: 0;
    }
    @media (max-width: 720px) {
      .ge-cad__linha--dados,
      .ge-cad__linha--fluxo {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class GuardaEncomendaFormComponent implements OnInit {
  model: GuardaEncomenda = {} as GuardaEncomenda;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Guarda Encomenda';
  showDeleteConfirm = false;
  readonly permissionKey = 'GUARDAENCOMENDA';
  canEdit = true;
  canDelete = true;
  fk_idUnidade: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];
  fk_idPessoaEntrada: ComboboxOption[] = [];
  fk_idPessoaSaida: ComboboxOption[] = [];

  constructor(
    private service: GuardaEncomendaService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private unidadeService: UnidadeService,
    private localService: LocalService,
    private pessoafisicaService: PessoafisicaService,
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

    
    this.pageLoad.run(this.unidadeService.getPaged(1, 200), r => {
      this.fk_idUnidade = r.items.map((x: any) => ({
        value: x.idUnidade,
        label: this.fkLabel_idUnidade(x)
      }));
    });

    this.pageLoad.run(this.localService.getPaged(1, 200), r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });

    this.pageLoad.run(this.pessoafisicaService.getPaged(1, 200), r => {
      this.fk_idPessoaEntrada = r.items.map((x: any) => ({
        value: x.idPessoaEntrada,
        label: this.fkLabel_idPessoaEntrada(x)
      }));
    });

    this.pageLoad.run(this.pessoafisicaService.getPaged(1, 200), r => {
      this.fk_idPessoaSaida = r.items.map((x: any) => ({
        value: x.idPessoaSaida,
        label: this.fkLabel_idPessoaSaida(x)
      }));
    });
    const idGuardaEncomenda = this.route.snapshot.paramMap.get('idGuardaEncomenda');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idGuardaEncomenda) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idGuardaEncomenda), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
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
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/guardaencomenda']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/guardaencomenda']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/guardaencomenda']); }

  confirmDelete(): void {
    this.service.delete(this.model.idGuardaEncomenda!).subscribe({ next: () => this.router.navigate(['/guardaencomenda']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idUnidade(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idUnidade ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
  fkLabel_idPessoaEntrada(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
  fkLabel_idPessoaSaida(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoafisica ?? '');
  }
}
