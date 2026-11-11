import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast.service';

interface PerfilOpt { idPerfil: number; descricao: string; }
interface PessoaOpt { idPessoa: number; nome: string; }
interface Linha {
  permissionKey: string;
  displayName: string;
  modulo: string;
  visualizar: boolean;
  incluir: boolean;
  alterar: boolean;
  excluir: boolean;
}

@Component({
  selector: 'app-gerenciamento-permissoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: { class: 'form-page form-page--wide' },
  template: `
    <h1>Permissões do condomínio ativo</h1>
    <p class="hint">A matriz do perfil vale para todos os condomínios. A exceção vale só neste condomínio.</p>
    <div class="modo">
      <label><input type="radio" name="modo" value="perfil" [(ngModel)]="modo" (ngModelChange)="carregar()" /> Matriz do perfil</label>
      <label><input type="radio" name="modo" value="pessoa" [(ngModel)]="modo" (ngModelChange)="carregar()" /> Exceção da pessoa</label>
    </div>
    <div class="modo" *ngIf="modo === 'perfil'">
      <label>Perfil
        <select [(ngModel)]="idPerfil" (ngModelChange)="carregarLinhas()">
          <option [ngValue]="0">Selecione</option>
          <option *ngFor="let p of perfis" [ngValue]="p.idPerfil">{{ p.descricao }}</option>
        </select>
      </label>
      <p *ngIf="perfilAdministrador" class="hint">Administrador tem acesso total no condomínio ativo. A matriz abaixo não restringe esse perfil.</p>
    </div>
    <div class="modo" *ngIf="modo === 'pessoa'">
      <label>Pessoa
        <select [(ngModel)]="idPessoa" (ngModelChange)="carregarLinhas()">
          <option [ngValue]="0">Selecione</option>
          <option *ngFor="let p of pessoas" [ngValue]="p.idPessoa">{{ p.nome }}</option>
        </select>
      </label>
    </div>
    <div *ngFor="let modulo of modulos" class="modulo">
      <button type="button" class="modulo__titulo" (click)="toggle(modulo)">{{ modulo }}</button>
      <table *ngIf="aberto(modulo)">
        <thead>
          <tr>
            <th>Funcionalidade</th>
            <th>Visualizar</th>
            <th>Incluir</th>
            <th>Alterar</th>
            <th>Excluir</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let linha of doModulo(modulo)">
            <td>{{ linha.displayName }}</td>
            <td><input type="checkbox" [(ngModel)]="linha.visualizar" /></td>
            <td><input type="checkbox" [(ngModel)]="linha.incluir" /></td>
            <td><input type="checkbox" [(ngModel)]="linha.alterar" /></td>
            <td><input type="checkbox" [(ngModel)]="linha.excluir" /></td>
          </tr>
        </tbody>
      </table>
    </div>
    <button type="button" class="btn-gravar" [disabled]="salvando || !linhas.length" (click)="salvar()">Gravar</button>
  `,
  styles: [`
    .hint { color: #64748b; }
    .modo { display: flex; gap: 16px; margin: 12px 0; align-items: center; }
    .modulo { margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .modulo__titulo { width: 100%; text-align: left; background: #f8fafc; border: 0; padding: 10px 12px; font-weight: 600; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; border-top: 1px solid #e2e8f0; text-align: left; }
    .btn-gravar { margin-top: 16px; }
  `]
})
export class GerenciamentoPermissoesComponent implements OnInit {
  modo: 'perfil' | 'pessoa' = 'perfil';
  perfis: PerfilOpt[] = [];
  pessoas: PessoaOpt[] = [];
  idPerfil = 0;
  idPessoa = 0;
  linhas: Linha[] = [];
  abertos = new Set<string>();
  salvando = false;

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit(): void { this.carregar(); }

  get perfilAdministrador(): boolean {
    return (this.perfis.find(p => p.idPerfil === this.idPerfil)?.descricao ?? '').toLowerCase() === 'administrador';
  }

  get modulos(): string[] {
    return [...new Set(this.linhas.map(l => l.modulo))];
  }

  doModulo(modulo: string): Linha[] {
    return this.linhas.filter(l => l.modulo === modulo);
  }

  aberto(modulo: string): boolean { return this.abertos.has(modulo); }

  toggle(modulo: string): void {
    if (this.abertos.has(modulo)) this.abertos.delete(modulo);
    else this.abertos.add(modulo);
  }

  carregar(): void {
    this.linhas = [];
    if (this.modo === 'perfil') {
      this.http.get<PerfilOpt[]>(`${environment.apiUrl}/Permissao/perfis`).subscribe({
        next: items => { this.perfis = items; if (this.idPerfil) this.carregarLinhas(); },
        error: () => this.toast.showError('Sem permissão para gerenciar o catálogo.')
      });
    } else {
      this.http.get<PessoaOpt[]>(`${environment.apiUrl}/Permissao/pessoas`).subscribe({
        next: items => { this.pessoas = items; if (this.idPessoa) this.carregarLinhas(); },
        error: () => this.toast.showError('Sem permissão para gerenciar o catálogo.')
      });
    }
  }

  carregarLinhas(): void {
    if (this.modo === 'perfil' && this.idPerfil) {
      this.http.get<Linha[]>(`${environment.apiUrl}/Permissao/perfil/${this.idPerfil}`).subscribe({
        next: rows => this.abrir(rows),
        error: () => this.toast.showError('Não foi possível ler a matriz.')
      });
    }
    if (this.modo === 'pessoa' && this.idPessoa) {
      this.http.get<Linha[]>(`${environment.apiUrl}/Permissao/pessoa/${this.idPessoa}/excecoes`).subscribe({
        next: rows => this.abrir(rows),
        error: () => this.toast.showError('Não foi possível ler as exceções.')
      });
    }
  }

  salvar(): void {
    this.salvando = true;
    const url = this.modo === 'perfil'
      ? `${environment.apiUrl}/Permissao/perfil/${this.idPerfil}`
      : `${environment.apiUrl}/Permissao/pessoa/${this.idPessoa}/excecoes`;
    this.http.put(url, this.linhas).subscribe({
      next: () => { this.toast.showSuccess('Gravado.'); this.salvando = false; },
      error: () => { this.toast.showError('Não foi possível gravar.'); this.salvando = false; }
    });
  }

  private abrir(rows: Linha[]): void {
    this.linhas = rows;
    this.abertos = new Set(rows.map(r => r.modulo));
  }
}
