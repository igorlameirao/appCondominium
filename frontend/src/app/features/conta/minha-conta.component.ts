import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioFotoComponent } from '../../shared/foto-perfil/usuario-foto.component';

@Component({
  selector: 'app-minha-conta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Icone, UsuarioFotoComponent],
  template: `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page minha-conta-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Minha conta</span>
          </nav>
          <h1 class="cad-titulo">Minha conta</h1>
          <p class="cad-subtitulo">Atualize sua foto e altere sua senha de acesso.</p>
        </header>

        <section class="cad-card form-page minha-conta-card">
          <div class="minha-conta-identidade">
            <app-usuario-foto
              layout="pagina"
              [fotoUrl]="conta.fotoUrl()"
              [nome]="nome"
              (fotoSelecionada)="enviarFoto($event)"
              (fotoRemovida)="removerFoto()"
            />
            <div class="minha-conta-identidade__dados">
              <h2 class="minha-conta-identidade__nome">{{ nome }}</h2>
              <p class="minha-conta-identidade__perfil">{{ perfil }}</p>
              <p *ngIf="email" class="minha-conta-identidade__email">{{ email }}</p>
            </div>
          </div>

          <form class="minha-conta-senha" (ngSubmit)="salvarSenha()">
            <h3 class="cad-secao__titulo">Alterar senha</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="senhaAtual">Senha atual</label>
                <input id="senhaAtual" type="password" autocomplete="current-password" [(ngModel)]="senhaAtual" name="senhaAtual" required />
              </div>
              <div class="form-group">
                <label for="senhaNova">Nova senha</label>
                <input id="senhaNova" type="password" autocomplete="new-password" [(ngModel)]="senhaNova" name="senhaNova" required minlength="8" />
              </div>
              <div class="form-group">
                <label for="senhaConfirma">Confirmar nova senha</label>
                <input id="senhaConfirma" type="password" autocomplete="new-password" [(ngModel)]="senhaConfirma" name="senhaConfirma" required />
              </div>
            </div>
            <p *ngIf="erroSenha" class="erro-form">{{ erroSenha }}</p>
            <div class="actions form-actions cad-acoes">
              <span class="cad-acoes__espaco"></span>
              <button type="submit" class="btn-gravar" [disabled]="salvandoSenha">Salvar senha</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
})
export class MinhaContaComponent implements OnInit {
  conta = inject(ContaService);
  private toast = inject(ToastService);

  senhaAtual = '';
  senhaNova = '';
  senhaConfirma = '';
  erroSenha = '';
  salvandoSenha = false;

  get nome(): string {
    return this.conta.perfil()?.nome ?? sessionStorage.getItem('nome') ?? 'Usuário';
  }

  get perfil(): string {
    return this.conta.perfil()?.perfil ?? sessionStorage.getItem('perfil') ?? '';
  }

  get email(): string | null | undefined {
    return this.conta.perfil()?.email;
  }

  ngOnInit(): void {
    this.conta.carregarPerfil().subscribe({
      error: () => this.conta.sincronizarComSessao(),
    });
  }

  enviarFoto(arquivo: File): void {
    this.conta.enviarFoto(arquivo).subscribe({
      next: () => this.toast.showSuccess('Foto atualizada.'),
      error: () => this.toast.showError('Não foi possível gravar a foto.'),
    });
  }

  removerFoto(): void {
    this.conta.removerFoto().subscribe({
      next: () => this.toast.showSuccess('Foto removida.'),
      error: () => this.toast.showError('Não foi possível remover a foto.'),
    });
  }

  salvarSenha(): void {
    this.erroSenha = '';
    if (this.senhaNova !== this.senhaConfirma) {
      this.erroSenha = 'A confirmação não coincide com a nova senha.';
      return;
    }
    if (this.senhaNova.length < 8) {
      this.erroSenha = 'A nova senha deve ter pelo menos 8 caracteres.';
      return;
    }
    this.salvandoSenha = true;
    this.conta.alterarSenha(this.senhaAtual, this.senhaNova).subscribe({
      next: () => {
        this.toast.showSuccess('Senha alterada.');
        this.senhaAtual = '';
        this.senhaNova = '';
        this.senhaConfirma = '';
        this.salvandoSenha = false;
      },
      error: err => {
        this.salvandoSenha = false;
        const msg = typeof err?.error === 'string' ? err.error : 'Não foi possível alterar a senha.';
        this.erroSenha = msg;
      },
    });
  }
}
