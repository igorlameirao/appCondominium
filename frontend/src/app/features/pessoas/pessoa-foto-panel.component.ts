import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioFotoComponent } from '../../shared/foto-perfil/usuario-foto.component';

@Component({
  selector: 'app-pessoa-foto-panel',
  standalone: true,
  imports: [CommonModule, UsuarioFotoComponent],
  template: `
    <div class="cad-secao">
      <div>
        <h2 class="cad-secao__titulo">Foto de perfil</h2>
        <p class="cad-secao__texto">
          A foto e o reconhecimento facial (embedding) são gravados ao clicar em <strong>Salvar</strong>, junto com os demais dados.
        </p>
      </div>
    </div>
    <div class="minha-conta-identidade pessoa-foto-panel">
      <app-usuario-foto
        layout="pagina"
        [fotoUrl]="fotoUrl"
        [nome]="nome"
        [somenteLeitura]="!podeEditar"
        (fotoSelecionada)="fotoSelecionada.emit($event)"
        (fotoRemovida)="fotoRemovida.emit()"
      />
      <div class="pessoa-foto-panel__meta">
        <p class="cad-secao__texto" *ngIf="fotoAlteradaPendente">Alteração pendente — use Salvar para aplicar.</p>
        <p class="cad-secao__texto" *ngIf="!fotoAlteradaPendente && temEmbedding">Embedding facial atualizado no cadastro.</p>
        <p class="cad-secao__texto" *ngIf="!fotoAlteradaPendente && temFoto && !temEmbedding">
          Foto no cadastro; embedding pendente de modelo ONNX no servidor.
        </p>
        <p class="cad-secao__texto" *ngIf="!fotoAlteradaPendente && !temFoto && !fotoUrl">Nenhuma foto cadastrada.</p>
      </div>
    </div>
  `,
})
export class PessoaFotoPanelComponent {
  @Input() fotoUrl: string | null = null;
  @Input() nome = '';
  @Input() podeEditar = false;
  @Input() temFoto = false;
  @Input() temEmbedding = false;
  @Input() fotoAlteradaPendente = false;

  @Output() fotoSelecionada = new EventEmitter<File>();
  @Output() fotoRemovida = new EventEmitter<void>();
}