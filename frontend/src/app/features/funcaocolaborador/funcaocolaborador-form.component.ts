import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ToastService } from '../../core/services/toast.service';
import { PermissionService } from '../../core/services/permission.service';
import { FuncaoColaborador } from './funcaocolaborador.model';
import { FuncaoColaboradorService } from './funcaocolaborador.service';

@Component({
  selector: 'app-funcaocolaborador-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a routerLink="/funcaocolaborador">Funções de colaborador</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span>{{ isEdit ? 'Editar' : 'Nova' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Nova' }} função</h1>
        </header>
        <section class="cad-card form-page">
          <form id="fnForm" novalidate (ngSubmit)="salvar(f)" #f="ngForm">
            <div class="form-group">
              <label>Descrição *</label>
              <input type="text" name="descricao" [(ngModel)]="model.descricao" maxlength="80" required />
            </div>
          </form>
          <div class="actions form-actions cad-acoes">
            <button type="submit" class="btn-gravar" form="fnForm" [disabled]="saving || !podeGravar">Salvar</button>
            <button type="button" class="btn-cancelar" (click)="voltar()">Voltar</button>
            <button type="button" class="btn-excluir" *ngIf="isEdit && podeExcluir" (click)="excluir()">Excluir</button>
          </div>
        </section>
      </div>
    </div>
  `
})
export class FuncaoColaboradorFormComponent implements OnInit {
  model: FuncaoColaborador = {};
  isEdit = false;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: FuncaoColaboradorService,
    private toast: ToastService,
    private permissions: PermissionService
  ) {}

  get podeGravar(): boolean {
    return this.isEdit
      ? this.permissions.can('FUNCAOCOLABORADOR', 'Alterar')
      : this.permissions.can('FUNCAOCOLABORADOR', 'Incluir');
  }
  get podeExcluir(): boolean { return this.permissions.can('FUNCAOCOLABORADOR', 'Excluir'); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idFuncaoColaborador');
    if (!id || id === 'novo') return;
    this.isEdit = true;
    this.api.getById(id).subscribe(r => this.model = r);
  }

  salvar(f: NgForm): void {
    if (!f.valid || !this.podeGravar) return;
    this.saving = true;
    const done = () => { this.saving = false; this.toast.showSuccess('Função salva.'); this.voltar(); };
    const fail = (e: { error?: string }) => { this.saving = false; this.toast.showError(typeof e.error === 'string' ? e.error : 'Erro ao gravar'); };
    if (this.isEdit) this.api.update(this.model).subscribe({ next: done, error: fail });
    else this.api.create(this.model).subscribe({ next: done, error: fail });
  }

  excluir(): void {
    if (!this.model.idFuncaoColaborador) return;
    this.api.delete(this.model.idFuncaoColaborador).subscribe({
      next: () => this.voltar(),
      error: () => this.toast.showError('Não foi possível excluir.')
    });
  }

  voltar(): void { void this.router.navigate(['/funcaocolaborador']); }
}
