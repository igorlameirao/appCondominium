import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioFotoComponent } from '../../shared/foto-perfil/usuario-foto.component';
import { AlterarSenhaModalComponent } from '../../shared/alterar-senha/alterar-senha-modal.component';

@Component({
  selector: 'app-minha-conta',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, UsuarioFotoComponent, AlterarSenhaModalComponent],
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
          <p class="cad-subtitulo">Atualize sua foto e gerencie a segurança da sua conta.</p>
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

          <div class="minha-conta-seguranca">
            <h3 class="cad-secao__titulo">Segurança</h3>
            <p class="minha-conta-seguranca__texto">
              Mantenha sua senha em dia. Ao alterá-la, você receberá um e-mail de confirmação.
            </p>
            <div class="minha-conta-seguranca__acoes cad-acoes">
              <span class="cad-acoes__espaco"></span>
              <button type="button" class="btn-filtrar" (click)="abrirAlterarSenha()">
                <app-icone nome="lock" [tamanho]="14" />
                Alterar senha
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <app-alterar-senha-modal [aberto]="modalSenhaAberto" (fechar)="fecharAlterarSenha()" />
  `,
})
export class MinhaContaComponent implements OnInit {
  conta = inject(ContaService);
  private toast = inject(ToastService);

  modalSenhaAberto = false;

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

  abrirAlterarSenha(): void {
    this.modalSenhaAberto = true;
  }

  fecharAlterarSenha(): void {
    this.modalSenhaAberto = false;
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
}