import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Icone } from '../../shared/icone';
import { ToastService } from '../../core/services/toast.service';
import { PermissoesMatrizComponent } from './permissoes-matriz.component';
import { PermissoesRodapeComponent } from './permissoes-rodape.component';
import {
  clonarLinhas,
  ehPerfilAdministrador,
  linhasIguais,
  PerfilOpcao,
  PermissaoLinha,
} from './permissoes.util';

@Component({
  selector: 'app-permissoes-perfil-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, Icone, PermissoesMatrizComponent, PermissoesRodapeComponent],
  host: { class: 'lib-acesso-host' },
  template: `
    <div class="content-wrapper cad-wrapper lib-acesso-wrapper">
      <div class="cad-page lib-acesso-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a routerLink="/gerenciamento-permissoes/perfil">Permissões por perfil</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Matriz</span>
          </nav>
          <h1 class="cad-titulo">Matriz de permissões</h1>
          <ng-container *ngIf="perfilRotulo as rotulo">
            <div class="lib-acesso-perfil-ident" aria-label="Perfil em edição">
              <span class="lib-acesso-perfil-ident__rotulo">Perfil:</span>
              <span class="lib-acesso-perfil-ident__chip">{{ rotulo }}</span>
              <span *ngIf="bloqueado" class="lib-acesso-perfil-ident__chip lib-acesso-perfil-ident__chip--protegido">Protegido</span>
            </div>
            <p class="cad-subtitulo">Alterações aplicadas a todos os usuários vinculados a este perfil no condomínio ativo.</p>
          </ng-container>
          <p *ngIf="carregando" class="cad-subtitulo">Carregando permissões...</p>
        </header>

        <p *ngIf="bloqueado" class="lib-acesso-aviso lib-acesso-aviso--topo" role="status">
          O perfil Administrador tem acesso total neste condomínio e não é configurável.
        </p>

        <section *ngIf="linhas.length" class="cad-painel-card cad-painel-card--primario lib-acesso-matriz" aria-label="Permissões do perfil">
          <header class="cad-painel-card__titulo">
            <app-icone nome="layers" [tamanho]="18" /> Matriz de permissões
          </header>
          <div class="cad-painel-card__corpo lib-acesso-matriz__corpo">
            <app-permissoes-matriz
              modo="perfil"
              [linhas]="linhas"
              [podeAlterar]="podeAlterar"
              [modulosExpandidos]="modulosExpandidos"
            />
          </div>
          <app-permissoes-rodape
            [podeAlterar]="podeAlterar"
            [temAlteracao]="temAlteracao"
            (voltar)="voltar()"
            (desfazer)="desfazer()"
            (solicitarSalvar)="salvar()"
          />
        </section>
      </div>
    </div>
  `,
})
export class PermissoesPerfilEditComponent implements OnInit {
  idPerfil = 0;
  perfilRotulo = '';
  bloqueado = false;
  linhas: PermissaoLinha[] = [];
  linhasInicial: PermissaoLinha[] = [];
  modulosExpandidos = new Set<string>();
  carregando = false;

  @ViewChild(PermissoesRodapeComponent) private rodape?: PermissoesRodapeComponent;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) {
        void this.router.navigate(['/gerenciamento-permissoes/perfil']);
        return;
      }
      this.idPerfil = id;
      this.carregarMetaEGrades();
    });
  }

  get podeAlterar(): boolean {
    return !this.bloqueado && !!this.linhas.length;
  }

  get temAlteracao(): boolean {
    return !linhasIguais(this.linhas, this.linhasInicial);
  }

  voltar(): void {
    void this.router.navigate(['/gerenciamento-permissoes/perfil']);
  }

  desfazer(): void {
    this.linhas = clonarLinhas(this.linhasInicial);
    this.rodape?.aoDesfazer();
    this.cd.detectChanges();
  }

  salvar(): void {
    if (!this.podeAlterar || !this.idPerfil) return;
    this.rodape?.iniciarGravacao();
    this.http.put(`${environment.apiUrl}/Permissao/perfil/${this.idPerfil}`, this.linhas).subscribe({
      next: () => {
        this.linhasInicial = clonarLinhas(this.linhas);
        this.toast.showSuccess('Permissões do perfil gravadas.');
        this.rodape?.encerrarGravacao(true);
      },
      error: () => {
        this.toast.showError('Não foi possível gravar.');
        this.rodape?.encerrarGravacao(false);
      },
    });
  }

  private carregarMetaEGrades(): void {
    this.carregando = true;
    this.linhas = [];
    this.http.get<PerfilOpcao[]>(`${environment.apiUrl}/Permissao/perfis`).subscribe({
      next: perfis => {
        const perfil = perfis.find(p => p.idPerfil === this.idPerfil);
        this.perfilRotulo = perfil?.descricao ?? `Perfil #${this.idPerfil}`;
        this.bloqueado = ehPerfilAdministrador(this.perfilRotulo);
        this.carregarLinhas();
      },
      error: () => {
        this.carregando = false;
        this.toast.showError('Falha ao carregar perfil.');
        void this.router.navigate(['/gerenciamento-permissoes/perfil']);
      },
    });
  }

  private carregarLinhas(): void {
    this.http.get<PermissaoLinha[]>(`${environment.apiUrl}/Permissao/perfil/${this.idPerfil}`).subscribe({
      next: rows => {
        this.linhas = clonarLinhas(rows);
        this.linhasInicial = clonarLinhas(rows);
        this.modulosExpandidos = new Set(rows.map(r => r.modulo));
        this.carregando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.carregando = false;
        this.toast.showError('Não foi possível ler a matriz.');
        void this.router.navigate(['/gerenciamento-permissoes/perfil']);
      },
    });
  }
}
