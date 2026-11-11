import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ContaService } from '../../core/services/conta.service';
import { ToastService } from '../../core/services/toast.service';
import { UsuarioFotoComponent } from '../foto-perfil/usuario-foto.component';
import { Icone } from '../icone';

@Component({
  selector: 'app-sidebar-usuario',
  standalone: true,
  imports: [UsuarioFotoComponent, Icone],
  template: `
    <div class="sidebar-user-block">
      <app-usuario-foto
        layout="sidebar"
        [fotoUrl]="conta.fotoUrl()"
        [nome]="nome"
        (irConta)="irConta()"
        (fotoSelecionada)="enviarFoto($event)"
        (fotoRemovida)="removerFoto()"
      />
      <div class="sidebar-user-block__texto">
        <div class="sidebar-user-block__nome">{{ nome }}</div>
        <div class="sidebar-user-block__perfil">{{ perfil }}</div>
      </div>
      <button
        type="button"
        class="sidebar-user-block__settings"
        title="Minha conta"
        aria-label="Minha conta e configurações"
        (click)="irConta()">
        <app-icone nome="settings" [tamanho]="18" />
      </button>
    </div>
  `,
})
export class SidebarUsuarioComponent implements OnInit {
  readonly conta = inject(ContaService);
  private router = inject(Router);
  private toast = inject(ToastService);

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

  irConta(): void {
    void this.router.navigate(['/minha-conta']);
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
