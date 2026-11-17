import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioFotoComponent } from '../foto-perfil/usuario-foto.component';
import { Icone } from '../icone';
import { AlterarSenhaModalComponent } from '../alterar-senha/alterar-senha-modal.component';

@Component({
  selector: 'app-sidebar-usuario',
  standalone: true,
  imports: [UsuarioFotoComponent, Icone, AlterarSenhaModalComponent],
  template: `
    <div class="sidebar-user-block" [class.sidebar-user-block--menu-aberto]="menuUsuarioAberto">
      <div class="sidebar-user-block__avatar-menu">
        <app-usuario-foto
          layout="sidebar"
          avatarAcao="menu"
          [fotoUrl]="conta.fotoUrl()"
          [nome]="nome"
          (menuConta)="alternarMenuUsuario()"
          (fotoSelecionada)="enviarFoto($event)"
          (fotoRemovida)="removerFoto()"
        />
        @if (menuUsuarioAberto) {
          <div
            #menuUsuario
            class="sidebar-user-menu__painel foto-perfil-menu__painel"
            role="menu"
            aria-label="Conta do usuário"
            (click)="$event.stopPropagation()">
            <button type="button" role="menuitem" class="foto-perfil-menu__item" (click)="irConta()">
              <app-icone nome="user" [tamanho]="14" />
              <span>Minha conta</span>
            </button>
            <button type="button" role="menuitem" class="foto-perfil-menu__item" (click)="abrirAlterarSenha()">
              <app-icone nome="lock" [tamanho]="14" />
              <span>Alterar senha</span>
            </button>
          </div>
        }
      </div>
      <div class="sidebar-user-block__texto">
        <div class="sidebar-user-block__nome">{{ nome }}</div>
        <div class="sidebar-user-block__perfil">{{ perfil }}</div>
      </div>
      <button
        #gatilhoMenu
        type="button"
        class="sidebar-user-block__settings"
        title="Conta e senha"
        aria-label="Menu da conta"
        aria-haspopup="menu"
        [attr.aria-expanded]="menuUsuarioAberto"
        (click)="alternarMenuUsuario()">
        <app-icone nome="settings" [tamanho]="18" />
      </button>
    </div>

    <app-alterar-senha-modal [aberto]="modalSenhaAberto" (fechar)="fecharAlterarSenha()" />
  `,
})
export class SidebarUsuarioComponent implements OnInit {
  readonly conta = inject(ContaService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  menuUsuarioAberto = false;
  modalSenhaAberto = false;

  @ViewChild('menuUsuario') private menuUsuario?: ElementRef<HTMLElement>;
  @ViewChild('gatilhoMenu') private gatilhoMenu?: ElementRef<HTMLButtonElement>;

  get nome(): string {
    return this.conta.perfil()?.nome ?? sessionStorage.getItem('nome') ?? 'Usuário';
  }

  get perfil(): string {
    return this.conta.perfil()?.perfil ?? sessionStorage.getItem('perfil') ?? '';
  }

  ngOnInit(): void {
    this.conta.sincronizarComSessao();
    this.conta.carregarPerfil().subscribe({
      error: () => this.conta.sincronizarComSessao(),
    });
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAberto = !this.menuUsuarioAberto;
    this.cd.detectChanges();
  }

  fecharMenuUsuario(): void {
    if (!this.menuUsuarioAberto) return;
    this.menuUsuarioAberto = false;
  }

  irConta(): void {
    this.fecharMenuUsuario();
    void this.router.navigate(['/minha-conta']);
  }

  abrirAlterarSenha(): void {
    this.fecharMenuUsuario();
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

  @HostListener('document:click', ['$event'])
  fecharMenuAoClicarFora(evento: MouseEvent): void {
    if (!this.menuUsuarioAberto) return;
    const alvo = evento.target as Node | null;
    if (!alvo) return;
    const bloco = this.gatilhoMenu?.nativeElement.closest('.sidebar-user-block');
    if (bloco?.contains(alvo)) return;
    this.fecharMenuUsuario();
  }

  @HostListener('document:keydown.escape')
  fecharPorEscape(): void {
    if (this.modalSenhaAberto) return;
    this.fecharMenuUsuario();
  }
}