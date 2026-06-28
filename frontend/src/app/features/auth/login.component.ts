import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1>App Condominium</h1>
        <p class="sub">RT-Gerais 13 — Login com condomínio</p>
        <label>Condomínio</label>
        <input type="text" [(ngModel)]="condominioBusca" (input)="buscarCondominios()" placeholder="Digite 3+ letras..." />
        <select [(ngModel)]="idCondominio" *ngIf="condominios.length">
          <option [ngValue]="null">Selecione...</option>
          <option *ngFor="let c of condominios" [ngValue]="c.idCondominio">{{ c.nome }}</option>
        </select>
        <label>Usuário (e-mail)</label>
        <input type="text" [(ngModel)]="usuario" autocomplete="username" />
        <label>Senha</label>
        <input type="password" [(ngModel)]="senha" autocomplete="current-password" />
        <p class="erro" *ngIf="erro">{{ erro }}</p>
        <button type="button" class="btn-login" (click)="entrar()" [disabled]="!idCondominio">Entrar</button>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f7fb; }
    .login-card { background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 10px 40px rgba(15,23,42,.08); width: 380px; display: flex; flex-direction: column; gap: 8px; }
    h1 { margin: 0; color: #0e7490; }
    .sub { color: #64748b; font-size: 13px; margin-bottom: 12px; }
    label { font-size: 13px; color: #334155; margin-top: 8px; }
    input, select { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .btn-login { margin-top: 16px; padding: 12px; background: #0e7490; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
    .btn-login:disabled { opacity: .5; }
    .erro { color: #dc3545; font-size: 13px; }
  `]
})
export class LoginComponent implements OnInit {
  usuario = '';
  senha = '';
  idCondominio: number | null = null;
  condominioBusca = '';
  condominios: { idCondominio: number; nome: string }[] = [];
  erro = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) this.router.navigate(['/']);
  }

  buscarCondominios(): void {
    if (this.condominioBusca.trim().length < 3) {
      this.condominios = [];
      return;
    }
    this.auth.listCondominios(this.condominioBusca.trim()).subscribe({
      next: r => this.condominios = r,
      error: () => this.condominios = []
    });
  }

  entrar(): void {
    if (!this.idCondominio) return;
    this.erro = '';
    this.auth.login({ usuario: this.usuario, senha: this.senha, idCondominio: this.idCondominio }).subscribe({
      next: () => this.router.navigate(['/']),
      error: e => this.erro = e?.error?.title ?? e?.message ?? 'Falha no login'
    });
  }
}
