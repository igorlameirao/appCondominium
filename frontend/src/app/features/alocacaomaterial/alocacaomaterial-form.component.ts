import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { ListLoadingModalComponent } from '../../shared/list-loading-modal/list-loading-modal.component';
import { FormInitialLoad } from '../../shared/form-initial-load';
import { FormsModule, NgForm } from '@angular/forms';
import { CampoDataHoraComponent } from '../../shared/campo-data-hora/campo-data-hora.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AlocacaoMaterialService } from './alocacaomaterial.service';
import { AlocacaoMaterial } from './alocacaomaterial.model';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { CondominioContextService } from '../../core/services/condominio-context.service';
import { MaterialService } from '../material/material.service';
import { PessoaCondominioService } from '../pessoacondominio/pessoacondominio.service';
import { LocalService } from '../local/local.service';

@Component({
  selector: 'app-alocacaomaterial-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, ListLoadingModalComponent, FormsModule, CampoDataHoraComponent, ComboboxCustomizadaComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'/alocacaomaterial'">Alocação de Material</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} Alocação de Material</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de alocação de material</p>
        </header>

        <section class="cad-card form-page cad-card--secao-unica">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="layers" [tamanho]="16" />
              <span>Dados da Alocação</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="layers" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados da Alocação</h2>
                <p class="cad-secao__texto">Informe o material, o responsável e o período da alocação</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
              <form id="entityForm" novalidate (ngSubmit)="submit(f)" #f="ngForm">
                @if (isEdit) {
                  <input
                    type="hidden"
                    [(ngModel)]="model.idAlocacaoMaterial"
                    name="idAlocacaoMaterial" />
                }
                <div class="cad-blocos alocacao-dados">
                  <div class="form-grid alocacao-dados__linha alocacao-dados__linha--1">
                    <div class="form-group alocacao-dados__campo">
                      <label>Material *</label>
                      <app-combobox-customizada
                        [options]="fk_idMaterial"
                        [(value)]="model.idMaterial"
                        [disabled]="fieldDisabled('idMaterial')"
                        [required]="true"
                        ariaLabel="Material" />
                    </div>
                  </div>
                  <div class="form-grid alocacao-dados__linha alocacao-dados__linha--2">
                    <div class="form-group alocacao-dados__campo">
                      <label>Locatário *</label>
                      <app-combobox-customizada
                        [options]="fk_idPessoa"
                        [(value)]="model.idPessoa"
                        [disabled]="fieldDisabled('idPessoa')"
                        [required]="true"
                        ariaLabel="Locatário" />
                    </div>
                    <div class="form-group alocacao-dados__campo">
                      <label>Local de Alocação *</label>
                      <app-combobox-customizada
                        [options]="fk_idLocal"
                        [(value)]="model.idLocal"
                        [disabled]="fieldDisabled('idLocal')"
                        [required]="true"
                        ariaLabel="Local de Alocação" />
                    </div>
                  </div>
                  <div class="form-grid alocacao-dados__linha alocacao-dados__linha--3">
                    <div class="form-group alocacao-dados__campo alocacao-dados__periodo">
                      <label>Início da Alocação *</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataHoraInicio"
                        name="dataHoraInicio"
                        [disabled]="fieldDisabled('dataHoraInicio')"
                        [required]="true"
                        [feedbackVisual]="true" />
                    </div>
                    <div class="form-group alocacao-dados__campo alocacao-dados__periodo">
                      <label>Fim da Alocação</label>
                      <app-campo-data-hora
                        [(ngModel)]="model.dataHoraFim"
                        name="dataHoraFim"
                        [disabled]="fieldDisabled('dataHoraFim')"
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
    .alocacao-dados {
      gap: 12px;
    }
    .alocacao-dados__linha--1 {
      grid-template-columns: minmax(0, 1fr);
      align-items: end;
    }
    .alocacao-dados__linha--2,
    .alocacao-dados__linha--3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: end;
    }
    .alocacao-dados__campo {
      min-width: 0;
    }
    .alocacao-dados__periodo > label {
      display: block;
    }
    @media (max-width: 720px) {
      .alocacao-dados__linha--2,
      .alocacao-dados__linha--3 {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `],
})
export class AlocacaoMaterialFormComponent implements OnInit {
  model: AlocacaoMaterial = {} as AlocacaoMaterial;
  isEdit = false;
  saving = false;
  readonly pageLoad = new FormInitialLoad();
  private readonly toast = inject(ToastService);
  private readonly entityTitle = 'Alocação de Material';
  showDeleteConfirm = false;
  readonly permissionKey = 'ALOCACAOMATERIAL';
  canEdit = true;
  canDelete = true;
  fk_idMaterial: ComboboxOption[] = [];
  fk_idPessoa: ComboboxOption[] = [];
  fk_idLocal: ComboboxOption[] = [];

  constructor(
    private service: AlocacaoMaterialService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private condominioCtx: CondominioContextService,
    private materialService: MaterialService,
    private pessoaCondominioService: PessoaCondominioService,
    private localService: LocalService,
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

    this.pageLoad.run(this.materialService.getPaged(1, 200), r => {
      this.fk_idMaterial = r.items.map((x: any) => ({
        value: x.idMaterial,
        label: this.fkLabel_idMaterial(x)
      }));
    });

    this.pageLoad.run(this.pessoaCondominioService.getPaged(1, 200), r => {
      this.fk_idPessoa = r.items.map((x: any) => ({
        value: x.idPessoa,
        label: this.fkLabel_idPessoa(x)
      }));
    });

    this.pageLoad.run(this.localService.getPaged(1, 200), r => {
      this.fk_idLocal = r.items.map((x: any) => ({
        value: x.idLocal,
        label: this.fkLabel_idLocal(x)
      }));
    });
    const idAlocacaoMaterial = this.route.snapshot.paramMap.get('idAlocacaoMaterial');
    const isNovo = this.route.snapshot.url.some(s => s.path === 'novo');
    if (isNovo) {
      this.isEdit = false;
      this.refreshPermissions();
      this.model.idCondominio = this.condominioCtx.idCondominio!;
      return;
    }
    if (idAlocacaoMaterial) {
      this.isEdit = true;
      this.refreshPermissions();
      this.pageLoad.run(this.service.getById(idAlocacaoMaterial), (r) => this.model = r, () => this.toast.showError('Registro não encontrado.'));
    }
    this.pageLoad.seal();
  }

  fieldDisabled(field: string): boolean {
    if (!this.canEdit) return true;
    if (!this.isEdit) return false;
    const roFields: string[] = [];
    return roFields.includes(field);
  }

  private dataHoraFimAnteriorAoInicio(): boolean {
    const ini = this.model.dataHoraInicio?.trim();
    const fim = this.model.dataHoraFim?.trim();
    if (!ini || !fim) return false;
    const normalizar = (v: string) => Date.parse(v.includes('T') ? v : v.replace(' ', 'T'));
    const tIni = normalizar(ini);
    const tFim = normalizar(fim);
    if (Number.isNaN(tIni) || Number.isNaN(tFim)) return false;
    return tFim < tIni;
  }

  submit(f: NgForm): void {
    if (!f.valid) {
      this.toast.showError('Preencha os campos obrigatórios antes de gravar.');
      return;
    }
    if (this.dataHoraFimAnteriorAoInicio()) {
      this.toast.showError('O fim da alocação não pode ser anterior ao início.');
      return;
    }
    this.saving = true;
    if (this.isEdit) {
      this.service.update(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/alocacaomaterial']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.create(this.model).subscribe({
        next: () => { this.toast.showSuccess(this.isEdit ? 'Alterações salvas com sucesso.' : this.entityTitle + ' gravado com sucesso.'); this.router.navigate(['/alocacaomaterial']); },
        error: (e: unknown) => { this.toast.showError((typeof (e as any)?.error === 'string' ? (e as any).error : null) ?? (e as any)?.error?.title ?? (e as any)?.error?.message ?? (e as any)?.message ?? 'Não foi possível salvar. Tente novamente.'); this.saving = false; },
        complete: () => this.saving = false
      });
    }
  }

  cancel(): void { this.router.navigate(['/alocacaomaterial']); }

  confirmDelete(): void {
    this.service.delete(this.model.idAlocacaoMaterial!).subscribe({ next: () => this.router.navigate(['/alocacaomaterial']), error: () => this.toast.showError('Não foi possível excluir. Tente novamente.') });
  }

  fkLabel_idMaterial(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idMaterial ?? '');
  }
  fkLabel_idPessoa(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idPessoaCondominio ?? '');
  }
  fkLabel_idLocal(x: any): string {
    return String(x?.descricao ?? x?.nome ?? x?.siglaUF ?? x?.cep ?? x?.idLocal ?? '');
  }
}
