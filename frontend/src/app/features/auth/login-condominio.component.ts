import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

/** RT-Gerais 13 — login com layout personalizado do condomínio. */
@Component({
  selector: 'app-login-condominio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page" [style.background]="corFundo">
      <div class="login-card">
        <img *ngIf="logoSrc" [src]="logoSrc" alt="Logo" class="logo" />
        <h1 [style.color]="corPadrao">{{ nomeCondominio || 'Condomínio' }}</h1>
        <p class="sub">Acesso de moradores e colaboradores</p>
        <label>Usuário (e-mail)</label>
        <input type="text" [(ngModel)]="usuario" autocomplete="username" />
        <label>Senha</label>
        <input type="password" [(ngModel)]="senha" autocomplete="current-password" />
        <p class="erro" *ngIf="erro">{{ erro }}</p>
        <button type="button" class="btn-login" [style.background]="corPadrao" (click)="entrar()">Entrar</button>
        <a href="/login" class="link-admin">Login administrador</a>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; transition: background .3s; }
    .login-card {
      background: #fff; padding: 32px; border-radius: 16px; width: 400px;
      box-shadow: 0 12px 40px rgba(0,0,0,.12); display: flex; flex-direction: column; gap: 8px;
    }
    .logo { max-height: 72px; object-fit: contain; margin-bottom: 8px; align-self: center; }
    h1 { margin: 0; text-align: center; }
    .sub { text-align: center; color: #64748b; font-size: 13px; margin-bottom: 12px; }
    label { font-size: 13px; font-weight: 600; margin-top: 8px; }
    input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .btn-login { padding: 12px; color: #fff; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; font-weight: 600; }
    .link-admin { font-size: 12px; margin-top: 12px; text-align: center; color: #64748b; }
    .erro { color: #dc3545; font-size: 13px; }
  `]
})
export class LoginCondominioComponent implements OnInit {
  idCondominio: number | null = null;
  usuario = '';
  senha = '';
  erro = '';
  corPadrao = '#0e7490';
  corFundo = '#f4f7fb';
  nomeCondominio = '';
  logoSrc: string | null = null;
  loginBgSrc: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('idCondominio');
    if (q) this.idCondominio = Number(q);
    if (!this.idCondominio) {
      this.erro = 'Informe idCondominio na URL: /entrar?idCondominio=1';
      return;
    }
    this.carregarTema();
  }

  carregarTema(): void {
    const base = `${environment.apiUrl}/lookup`;
    this.http.get<{ nome: string }>(`${base}/condominio-resumo/${this.idCondominio}`).subscribe({
      next: c => this.nomeCondominio = c.nome ?? '',
      error: () => {}
    });
    this.http.get<{ corPadrao?: string; imagemLogin?: string; imagemIcone?: string }>(
      `${base}/configuracao-por-condominio/${this.idCondominio}`
    ).subscribe({
      next: cfg => {
        if (cfg.corPadrao) {
          this.corPadrao = cfg.corPadrao.startsWith('#') ? cfg.corPadrao : `#${cfg.corPadrao}`;
          this.corFundo = this.corPadrao + '18';
        }
        if (cfg.imagemIcone) {
          this.logoSrc = cfg.imagemIcone.startsWith('data:')
            ? cfg.imagemIcone
            : `data:image/png;base64,${cfg.imagemIcone}`;
        }
        if (cfg.imagemLogin) {
          this.loginBgSrc = cfg.imagemLogin.startsWith('data:')
            ? cfg.imagemLogin
            : `data:image/jpeg;base64,${cfg.imagemLogin}`;
        }
      },
      error: () => {}
    });
  }

  entrar(): void {
    if (!this.idCondominio) return;
    this.erro = '';
    this.auth.login({ usuario: this.usuario, senha: this.senha, idCondominio: this.idCondominio }).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.erro = 'Credenciais inválidas.'
    });
  }
}
