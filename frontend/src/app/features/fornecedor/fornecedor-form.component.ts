import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icone } from '../../shared/icone';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentoInputComponent } from '../../shared/documento-input/documento-input.component';
import { CampoDataComponent } from '../../shared/campo-data/campo-data.component';
import { ComboboxCustomizadaComponent, ComboboxOption } from '../../shared/combobox-customizada/combobox-customizada.component';
import { PermissionService } from '../../core/services/permission.service';
import { FornecedorIntegradoService, FornecedorIntegradoRequest } from './fornecedor-integrado.service';
import { PessoafisicaService } from '../pessoafisica/pessoafisica.service';
import { ToastService } from '../../core/services/toast.service';
import { PessoaConsultaService } from '../../core/services/pessoa-consulta.service';
import { somenteDigitos } from '../../core/utils/documento-validator';
import { PessoaEnderecosPanelComponent } from '../pessoas/pessoa-enderecos-panel.component';

@Component({
  selector: 'app-fornecedor-form',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, FormsModule, DocumentoInputComponent, CampoDataComponent, ComboboxCustomizadaComponent, PessoaEnderecosPanelComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a routerLink="/fornecedor">Fornecedores</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} fornecedor</h1>
          <p class="cad-subtitulo">Cadastro integrado PF/PJ com vínculo no condomínio</p>
        </header>
        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba" [class.cad-aba--ativa]="abaCad === 'dados'" (click)="abaCad = 'dados'" [attr.aria-selected]="abaCad === 'dados'">
              <app-icone nome="briefcase" [tamanho]="16" />
              <span>Dados do fornecedor</span>
            </button>
            <button type="button" role="tab" class="cad-aba" *ngIf="idPessoaEnderecos" [class.cad-aba--ativa]="abaCad === 'enderecos'" (click)="abaCad = 'enderecos'" [attr.aria-selected]="abaCad === 'enderecos'">
              <app-icone nome="map-pin" [tamanho]="16" />
              <span>Endereços</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel" *ngIf="abaCad === 'dados'">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="briefcase" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados do fornecedor</h2>
                <p class="cad-secao__texto">Identificação, contato e vínculo operacional</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">
        <form id="entityForm" (ngSubmit)="submit(f)" #f="ngForm">
          <div class="form-grid">
            <div class="form-group fg-col-4">
              <label>CPF/CNPJ *</label>
              <app-documento-input [(ngModel)]="model.cpfcnpj" name="cpfcnpj" (ngModelChange)="onDocumentoChange()" [required]="true" [disabled]="isEdit" />
              <button type="button" class="btn-filtrar btn-busca-doc" *ngIf="!isEdit" (click)="buscarDocumento()">Buscar</button>
            </div>
            <div class="form-group fg-col-8">
              <label>Nome / Razão social *</label>
              <input type="text" [(ngModel)]="model.nome" name="nome" required maxlength="255" [readonly]="reutilizandoPessoa && !isEdit" />
            </div>
            <div class="form-group fg-col-4">
              <label>Telefone</label>
              <input type="text" [(ngModel)]="model.telefone" name="telefone" maxlength="20" />
            </div>
            <div *ngIf="ehPf" class="pf-fields">
              <div class="form-group fg-col-4">
                <label>Data nascimento *</label>
                <app-campo-data [(ngModel)]="model.dataNascimento" name="dataNascimento" [feedbackVisual]="true" [nascimento]="true" [disabled]="reutilizandoPessoa && !isEdit" [required]="ehPf" />
              </div>
              <div class="form-group fg-col-8">
                <label>E-mail</label>
                <input type="email" [(ngModel)]="model.email" name="email" [readonly]="reutilizandoPessoa && !isEdit" />
              </div>
            </div>
            <ng-container *ngIf="ehPj">
              <div class="form-group fg-col-8">
                <label>Nome fantasia</label>
                <input type="text" [(ngModel)]="model.nomeFantasia" name="nomeFantasia" [readonly]="reutilizandoPessoa && !isEdit" />
              </div>
              <div class="form-group fg-col-4">
                <label>Data fundação</label>
                <app-campo-data [(ngModel)]="model.dataFundacao" name="dataFundacao" [feedbackVisual]="true" [disabled]="reutilizandoPessoa && !isEdit" />
              </div>
              <div class="form-group fg-col-6">
                <label>Responsável</label>
                <app-combobox-customizada [options]="fkResponsavel" [(value)]="model.idResponsavel" [disabled]="reutilizandoPessoa && !isEdit" />
              </div>
            </ng-container>
            <div class="form-group fg-col-2">
              <label>Ativo</label>
              <input type="checkbox" [(ngModel)]="model.ativo" name="ativo" />
            </div>
            <div class="form-group fg-col-6" *ngIf="!isEdit">
              <label><input type="checkbox" [(ngModel)]="model.criarPapelVinculo" name="criarPapelVinculo" /> Criar papel operacional Fornecedor (sem perfil RBAC)</label>
            </div>
          </div>
          <p class="cad-aviso cad-aviso--ok" *ngIf="pessoaEncontradaMsg">{{ pessoaEncontradaMsg }}</p>
          <p class="cad-aviso" *ngIf="reutilizandoPessoa && !isEdit">Pessoa existente: apenas telefone, endereços e vínculo do fornecedor podem ser alterados (RN-Fornecedor 03).</p>
        </form>
            </div>
          </div>
          <div class="cad-conteudo" role="tabpanel" *ngIf="abaCad === 'enderecos' && idPessoaEnderecos">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="map-pin" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Endereços da pessoa</h2>
                <p class="cad-secao__texto" *ngIf="reutilizandoPessoa">Alteração permitida conforme RN-Fornecedor 03.</p>
              </div>
            </div>
            <app-pessoa-enderecos-panel [idPessoa]="idPessoaEnderecos" [podeEditar]="podeEditarEnderecos" />
          </div>
          <div class="actions form-actions cad-acoes">
        <button type="submit" class="btn-gravar" form="entityForm" [disabled]="saving || !podeGravar">Salvar</button>
        <span class="cad-acoes__espaco"></span>
        <button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>
      </div>
        </section>
      </div>
    </div>
    <p class="msg-erro cad-erro" *ngIf="formError">{{ formError }}</p>
  `,
  styles: [`.btn-busca-doc { margin-top: 6px; width: 100%; }`]
})
export class FornecedorFormComponent implements OnInit {
  model: FornecedorIntegradoRequest = { ativo: true, criarPapelVinculo: false };
  idFornecedor?: number;
  isEdit = false;
  saving = false;
  formError = '';
  reutilizandoPessoa = false;
  pessoaEncontradaMsg = '';
  buscandoDoc = false;
  fkResponsavel: ComboboxOption[] = [];
  readonly permissionKey = 'FORNECEDOR';
  abaCad: 'dados' | 'enderecos' = 'dados';

  constructor(
    private service: FornecedorIntegradoService,
    private route: ActivatedRoute,
    private router: Router,
    private permissions: PermissionService,
    private pfService: PessoafisicaService,
    private toast: ToastService,
    private pessoaConsulta: PessoaConsultaService
  ) {}

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can(this.permissionKey, 'Alterar')
      : this.permissions.can(this.permissionKey, 'Incluir');
  }

  get idPessoaEnderecos(): number | null {
    return this.model.idPessoa ?? null;
  }

  get podeEditarEnderecos(): boolean {
    return this.podeGravar;
  }

  get ehPf(): boolean {
    const d = (this.model.cpfcnpj ?? '').replace(/\D/g, '');
    return d.length > 0 && d.length <= 11;
  }

  get ehPj(): boolean { return (this.model.cpfcnpj ?? '').replace(/\D/g, '').length === 14; }

  ngOnInit(): void {
    this.pfService.getPaged(1, 200).subscribe(r => {
      this.fkResponsavel = (r.items ?? [])
        .filter(x => x.idPessoa != null)
        .map(x => ({
          value: x.idPessoa as number,
          label: String(x.idPessoa) + (x.email ? ` · ${x.email}` : '')
        }));
    });
    const id = this.route.snapshot.paramMap.get('idFornecedor');
    if (this.route.snapshot.url.some(s => s.path === 'novo')) return;
    if (id) {
      this.isEdit = true;
      this.idFornecedor = Number(id);
      this.service.obter(this.idFornecedor).subscribe({
        next: r => this.model = { ...r, ativo: r.ativo ?? true },
        error: () => this.formError = 'Fornecedor não encontrado.'
      });
    }
  }

  onDocumentoChange(): void {
    if (this.isEdit) return;
    this.pessoaEncontradaMsg = '';
    this.reutilizandoPessoa = false;
    this.model.idPessoa = undefined;
  }

  buscarDocumento(): void {
    if (this.isEdit) return;
    const doc = somenteDigitos(this.model.cpfcnpj ?? '');
    if (doc.length !== 11 && doc.length !== 14) {
      this.formError = 'Informe um CPF ou CNPJ válido antes de buscar.';
      return;
    }
    this.formError = '';
    this.buscandoDoc = true;
    this.pessoaConsulta.porDocumento(doc, 'cadastro').subscribe({
      next: p => {
        this.reutilizandoPessoa = true;
        this.model.idPessoa = p.idPessoa;
        this.model.nome = p.nome ?? '';
        this.model.telefone = p.telefone ?? this.model.telefone;
        if (p.ehPessoaJuridica) {
          this.model.nomeFantasia = p.nomeFantasia;
          this.model.dataFundacao = p.dataFundacao;
          this.model.idResponsavel = p.idResponsavel;
        } else {
          this.model.dataNascimento = p.dataNascimento;
          this.model.email = p.email;
        }
        this.pessoaEncontradaMsg = `Pessoa já cadastrada (id ${p.idPessoa}). Campos de identidade bloqueados.`;
        this.buscandoDoc = false;
      },
      error: () => {
        this.reutilizandoPessoa = false;
        this.model.idPessoa = undefined;
        this.pessoaEncontradaMsg = 'Nenhuma pessoa encontrada com este documento. Será criada ao gravar.';
        this.buscandoDoc = false;
      }
    });
  }

  private extrairErro(e: unknown): string {
    const body = (e as { error?: string | { title?: string } })?.error;
    if (typeof body === 'string') return body;
    return body?.title ?? 'Erro ao gravar';
  }

  submit(f: NgForm): void {
    if (!f.valid) { this.formError = 'Preencha os campos obrigatórios.'; return; }
    if (this.ehPf && !this.model.dataNascimento) {
      this.formError = 'Data de nascimento é obrigatória para fornecedor PF.';
      return;
    }
    this.saving = true;
    this.formError = '';
    const finalizarEdit = () => {
      this.toast.showSuccess('Fornecedor gravado com sucesso.');
      void this.router.navigate(['/fornecedor']);
    };
    const finalizarNovo = (res: { idFornecedor: number; idPessoa: number }) => {
      this.toast.showSuccess('Fornecedor gravado. Você pode cadastrar endereços abaixo ou voltar à listagem.');
      this.isEdit = true;
      this.idFornecedor = res.idFornecedor;
      this.model.idPessoa = res.idPessoa;
      this.abaCad = 'enderecos';
      this.saving = false;
    };
    if (this.isEdit && this.idFornecedor) {
      this.service.atualizar(this.idFornecedor, this.model).subscribe({
        next: () => finalizarEdit(),
        error: e => { this.formError = this.extrairErro(e); this.saving = false; },
        complete: () => this.saving = false
      });
    } else {
      this.service.criar(this.model).subscribe({
        next: res => finalizarNovo(res),
        error: e => {
          this.formError = this.extrairErro(e);
          if (this.formError.includes('reutilizar')) this.reutilizandoPessoa = true;
          this.saving = false;
        }
      });
    }
  }

  cancel(): void { void this.router.navigate(['/fornecedor']); }
}