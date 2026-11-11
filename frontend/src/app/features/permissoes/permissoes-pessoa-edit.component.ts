import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
  PermissaoLinha,
  PessoaOpcao,
} from './permissoes.util';

@Component({
  selector: 'app-permissoes-pessoa-edit',
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
            <a routerLink="/gerenciamento-permissoes/pessoa">Permissões por pessoa</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">Exceções</span>
          </nav>
          <h1 class="cad-titulo">Exceções de permissão</h1>
          <ng-container *ngIf="pessoaNome">
            <div class="lib-acesso-ident-inline" aria-label="Pessoa em edição">
              <span class="lib-acesso-ident-inline__item">
                <span class="lib-acesso-perfil-ident__rotulo">Pessoa:</span>
                <span class="lib-acesso-perfil-ident__chip lib-acesso-perfil-ident__chip--usuario">{{ pessoaNome }}</span>
              </span>
              <span class="lib-acesso-ident-inline__item" *ngIf="perfilRotulo">
                <span class="lib-acesso-perfil-ident__rotulo">Perfil:</span>
                <span class="lib-acesso-perfil-ident__chip">{{ perfilRotulo }}</span>
              </span>
              <span *ngIf="bloqueado" class="lib-acesso-perfil-ident__chip lib-acesso-perfil-ident__chip--protegido">Protegido</span>
            </div>
            <p class="cad-subtitulo cad-subtitulo--compacto">
              Configure somente diferenças em relação ao perfil. Valores iguais ao perfil não são gravados como exceção.
            </p>
          </ng-container>
          <p *ngIf="carregando" class="cad-subtitulo">Carregando permissões...</p>
        </header>

        <p *ngIf="bloqueado" class="lib-acesso-aviso lib-acesso-aviso--topo" role="status">
          Pessoa com perfil Administrador: somente leitura. A exceção não se aplica.
        </p>

        <section *ngIf="linhas.length" class="cad-painel-card cad-painel-card--primario lib-acesso-matriz" aria-label="Exceções da pessoa">
          <header class="cad-painel-card__titulo">
            <app-icone nome="layers" [tamanho]="18" /> Matriz de permissões
          </header>
          <div class="cad-painel-card__corpo lib-acesso-matriz__corpo">
            <app-permissoes-matriz
              modo="pessoa"
              [linhas]="linhas"
              [linhasPerfil]="linhasPerfil"
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
export class PermissoesPessoaEditComponent implements OnInit {
  idPessoa = 0;
  idPerfil: number | null = null;
  pessoaNome = '';
  perfilRotulo = '';
  bloqueado = false;
  linhas: PermissaoLinha[] = [];
  linhasInicial: PermissaoLinha[] = [];
  linhasPerfil: PermissaoLinha[] = [];
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
        void this.router.navigate(['/gerenciamento-permissoes/pessoa']);
        return;
      }
      this.idPessoa = id;
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
    void this.router.navigate(['/gerenciamento-permissoes/pessoa']);
  }

  desfazer(): void {
    this.linhas = clonarLinhas(this.linhasInicial);
    this.rodape?.aoDesfazer();
    this.cd.detectChanges();
  }

  salvar(): void {
    if (!this.podeAlterar || !this.idPessoa) return;
    this.rodape?.iniciarGravacao();
    this.http.put(`${environment.apiUrl}/Permissao/pessoa/${this.idPessoa}/excecoes`, this.linhas).subscribe({
      next: () => {
        this.linhasInicial = clonarLinhas(this.linhas);
        this.toast.showSuccess('Exceções gravadas.');
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
    this.http.get<PessoaOpcao[]>(`${environment.apiUrl}/Permissao/pessoas`).subscribe({
      next: pessoas => {
        const pessoa = pessoas.find(p => p.idPessoa === this.idPessoa);
        if (!pessoa) {
          this.carregando = false;
          this.toast.showError('Pessoa não encontrada neste condomínio.');
          void this.router.navigate(['/gerenciamento-permissoes/pessoa']);
          return;
        }
        this.pessoaNome = pessoa.nome;
        this.perfilRotulo = pessoa.perfilDescricao ?? '';
        this.idPerfil = pessoa.idPerfil ?? null;
        this.bloqueado = ehPerfilAdministrador(pessoa.perfilDescricao);
        this.carregarLinhas();
      },
      error: () => {
        this.carregando = false;
        this.toast.showError('Falha ao carregar pessoa.');
        void this.router.navigate(['/gerenciamento-permissoes/pessoa']);
      },
    });
  }

  private carregarLinhas(): void {
    const excecoes$ = this.http.get<PermissaoLinha[]>(`${environment.apiUrl}/Permissao/pessoa/${this.idPessoa}/excecoes`);
    const aoReceber = (rows: PermissaoLinha[], perfil: PermissaoLinha[]) => {
      this.linhas = clonarLinhas(rows);
      this.linhasInicial = clonarLinhas(rows);
      this.linhasPerfil = clonarLinhas(perfil);
      this.modulosExpandidos = new Set(rows.map(r => r.modulo));
      this.carregando = false;
      this.cd.detectChanges();
    };
    const aoErro = () => {
      this.carregando = false;
      this.toast.showError('Não foi possível ler as exceções.');
      void this.router.navigate(['/gerenciamento-permissoes/pessoa']);
    };

    if (this.idPerfil) {
      forkJoin({
        excecoes: excecoes$,
        perfil: this.http.get<PermissaoLinha[]>(`${environment.apiUrl}/Permissao/perfil/${this.idPerfil}`),
      }).subscribe({
        next: res => aoReceber(res.excecoes, res.perfil),
        error: aoErro,
      });
      return;
    }

    excecoes$.subscribe({
      next: rows => aoReceber(rows, []),
      error: aoErro,
    });
  }
}
