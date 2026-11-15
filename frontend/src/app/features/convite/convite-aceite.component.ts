import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ConviteService, ValidarConviteResponse } from './convite.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-convite-aceite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <h1 class="cad-titulo">Aceitar convite</h1>
          <p class="cad-subtitulo" *ngIf="validacao?.nomeCondominio">Condomínio: {{ validacao?.nomeCondominio }}</p>
        </header>

        <section class="cad-card form-page" *ngIf="!carregando">
          <div *ngIf="!validacao?.valido" class="mensagem-erro">{{ validacao?.mensagem ?? 'Convite indisponível.' }}</div>

          <form *ngIf="validacao?.valido && validacao?.requerDefinirSenha" (ngSubmit)="ativar()" #f="ngForm" class="form-grid">
            <label>Nome <input required [(ngModel)]="nome" name="nome" /></label>
            <label>CPF <input required [(ngModel)]="cpf" name="cpf" /></label>
            <label>E-mail <input required type="email" [(ngModel)]="email" name="email" /></label>
            <label>Data de nascimento <input required type="date" [(ngModel)]="dataNascimento" name="nascimento" /></label>
            <label>Senha <input required type="password" [(ngModel)]="senha" name="senha" minlength="8" /></label>
            <label>Telefone <input [(ngModel)]="telefone" name="telefone" /></label>
            <div class="cad-acoes">
              <button type="submit" class="btn-gravar" [disabled]="salvando">Ativar conta</button>
            </div>
          </form>

          <div *ngIf="validacao?.valido && validacao?.requerAutenticacao">
            <p>Entre com sua conta existente e confirme o aceite neste condomínio.</p>
            <div class="cad-acoes">
              <a *ngIf="!auth.isLoggedIn" routerLink="/login" [queryParams]="{ returnUrl: returnUrl }" class="btn-gravar">Fazer login</a>
              <button *ngIf="auth.isLoggedIn" type="button" class="btn-gravar" (click)="aceitarAutenticado()" [disabled]="salvando">Aceitar convite</button>
            </div>
          </div>

          <p *ngIf="mensagemOk" class="mensagem-ok">{{ mensagemOk }}</p>
        </section>
      </div>
    </div>
  `
})
export class ConviteAceiteComponent implements OnInit {
  token = '';
  validacao?: ValidarConviteResponse;
  carregando = true;
  salvando = false;
  mensagemOk = '';
  nome = '';
  cpf = '';
  email = '';
  dataNascimento = '';
  senha = '';
  telefone = '';
  returnUrl = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly convites: ConviteService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.returnUrl = this.router.url;
    if (!this.token) {
      this.carregando = false;
      this.validacao = { valido: false, codigo: 'vazio', mensagem: 'Link inválido.', requerAutenticacao: false, requerDefinirSenha: false };
      return;
    }
    this.convites.validar(this.token).subscribe({
      next: v => {
        this.validacao = v;
        this.email = v.emailMascarado?.includes('@') ? '' : '';
        this.carregando = false;
      },
      error: () => {
        this.validacao = { valido: false, codigo: 'erro', mensagem: 'Convite indisponível.', requerAutenticacao: false, requerDefinirSenha: false };
        this.carregando = false;
      }
    });
  }

  ativar(): void {
    this.salvando = true;
    this.convites.aceitarContaNova({
      token: this.token,
      nome: this.nome,
      cpf: this.cpf,
      email: this.email,
      dataNascimento: this.dataNascimento,
      senha: this.senha,
      telefone: this.telefone || null
    }).subscribe({
      next: r => {
        this.mensagemOk = r.mensagem;
        this.salvando = false;
      },
      error: e => {
        this.validacao = { ...this.validacao!, mensagem: e.error?.title ?? 'Não foi possível ativar a conta.' };
        this.salvando = false;
      }
    });
  }

  aceitarAutenticado(): void {
    this.salvando = true;
    this.convites.aceitarAutenticado(this.token).subscribe({
      next: r => {
        this.mensagemOk = r.mensagem;
        this.salvando = false;
      },
      error: () => {
        this.salvando = false;
      }
    });
  }
}