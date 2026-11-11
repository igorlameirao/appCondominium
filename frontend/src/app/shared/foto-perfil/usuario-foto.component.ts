import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { Icone } from '../icone';
import { AnexarAoBodyDirective } from './anexar-ao-body.directive';
import { iniciaisDeNome, mensagemErroCamera, validarArquivoFotoPerfil } from './foto-perfil.util';

let proximoMenuId = 0;

@Component({
  selector: 'app-usuario-foto',
  standalone: true,
  imports: [Icone, AnexarAoBodyDirective],
  templateUrl: './usuario-foto.component.html',
})
export class UsuarioFotoComponent implements OnDestroy {
  private cd = inject(ChangeDetectorRef);

  @Input() fotoUrl: string | null = null;
  @Input() nome = '';
  @Input() layout: 'sidebar' | 'pagina' = 'pagina';
  @Input() somenteLeitura = false;

  @Output() irConta = new EventEmitter<void>();
  @Output() fotoSelecionada = new EventEmitter<File>();
  @Output() fotoRemovida = new EventEmitter<void>();

  readonly menuId = `menu-foto-usuario-${++proximoMenuId}`;

  @ViewChild('preview') private preview?: ElementRef<HTMLVideoElement>;
  @ViewChild('arquivo') private arquivo?: ElementRef<HTMLInputElement>;
  @ViewChild('gatilhoFoto') private gatilhoFoto?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuFoto') private menuFoto?: ElementRef<HTMLElement>;

  menuFotoAberto = false;
  confirmarRemocao = false;
  capturaAberta = false;
  cameraPronta = false;
  dispositivos: MediaDeviceInfo[] = [];
  dispositivoId = '';
  erroCaptura = '';
  fotoCapturada: string | null = null;
  erro = '';

  private stream: MediaStream | null = null;
  private quadro: HTMLCanvasElement | null = null;
  private pedidoCamera = 0;

  get iniciais(): string {
    return iniciaisDeNome(this.nome);
  }

  ngOnDestroy(): void {
    this.encerrarCamera();
  }

  aoClicarAvatar(evento: MouseEvent): void {
    if (this.layout !== 'sidebar') return;
    evento.preventDefault();
    this.fecharMenuFoto();
    this.irConta.emit();
  }

  aoSelecionarArquivo(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const arquivo = campo.files?.[0];
    campo.value = '';
    if (!arquivo) return;
    this.erro = validarArquivoFotoPerfil(arquivo) ?? '';
    if (this.erro) {
      this.cd.detectChanges();
      return;
    }
    this.fotoSelecionada.emit(arquivo);
  }

  alternarMenuFoto(evento: Event): void {
    evento.stopPropagation();
    evento.preventDefault();
    if (this.menuFotoAberto) {
      this.fecharMenuFoto();
      return;
    }
    this.abrirMenuFoto(evento);
  }

  abrirMenuFoto(evento: Event): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.menuFotoAberto = true;
    this.cd.detectChanges();
    this.focarItemMenu(0);
  }

  escolherArquivo(): void {
    this.arquivo?.nativeElement.click();
    this.fecharMenuFoto();
  }

  iniciarCaptura(): void {
    this.fecharMenuFoto();
    void this.abrirCaptura();
  }

  pedirRemocao(): void {
    if (!this.fotoUrl) return;
    this.fecharMenuFoto();
    this.confirmarRemocao = true;
    this.cd.detectChanges();
  }

  cancelarRemocao(): void {
    this.confirmarRemocao = false;
  }

  confirmarRemocaoFoto(): void {
    this.confirmarRemocao = false;
    this.fotoRemovida.emit();
  }

  aoTeclaMenu(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      evento.stopPropagation();
      this.fecharMenuFoto(true);
      return;
    }
    const itens = this.itensMenu();
    if (!itens.length) return;
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      itens[atual < 0 ? 0 : (atual + 1) % itens.length].focus();
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      itens[atual < 0 ? itens.length - 1 : (atual - 1 + itens.length) % itens.length].focus();
    }
  }

  aoSairMenu(evento: FocusEvent): void {
    const proximo = evento.relatedTarget as Node | null;
    if (proximo && (this.menuFoto?.nativeElement.contains(proximo) || this.gatilhoFoto?.nativeElement.contains(proximo))) return;
    this.menuFotoAberto = false;
  }

  aoSairGatilho(evento: FocusEvent): void {
    if (!this.menuFotoAberto) return;
    const proximo = evento.relatedTarget as Node | null;
    if (proximo && this.menuFoto?.nativeElement.contains(proximo)) return;
    this.menuFotoAberto = false;
  }

  @HostListener('document:click', ['$event'])
  fecharMenuFotoAoClicarFora(evento: MouseEvent): void {
    if (!this.menuFotoAberto) return;
    const alvo = evento.target as Node | null;
    if (alvo && (this.gatilhoFoto?.nativeElement.contains(alvo) || this.menuFoto?.nativeElement.contains(alvo))) return;
    this.fecharMenuFoto();
  }

  @HostListener('document:keydown.escape')
  fecharPorEscape(): void {
    if (this.confirmarRemocao) {
      this.cancelarRemocao();
      return;
    }
    if (this.capturaAberta) {
      this.fecharCaptura();
      return;
    }
    if (this.menuFotoAberto) this.fecharMenuFoto(true);
  }

  async abrirCaptura(): Promise<void> {
    this.erroCaptura = '';
    this.fotoCapturada = null;
    this.quadro = null;
    this.cameraPronta = false;
    this.capturaAberta = true;
    this.cd.detectChanges();
    await this.iniciarCamera();
  }

  async trocarDispositivo(evento: Event): Promise<void> {
    const id = (evento.target as HTMLSelectElement).value;
    if (!id || id === this.dispositivoId) return;
    this.dispositivoId = id;
    this.fotoCapturada = null;
    this.quadro = null;
    await this.iniciarCamera(id);
  }

  capturar(): void {
    const video = this.preview?.nativeElement;
    if (!video?.videoWidth) {
      this.erroCaptura = 'Aguarde a imagem da câmera.';
      return;
    }
    const largura = 600;
    const altura = 800;
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const recorteLargura = largura / Math.max(largura / vw, altura / vh);
    const recorteAltura = altura / Math.max(largura / vw, altura / vh);
    ctx.drawImage(video, (vw - recorteLargura) / 2, (vh - recorteAltura) / 2, recorteLargura, recorteAltura, 0, 0, largura, altura);
    this.quadro = canvas;
    this.fotoCapturada = canvas.toDataURL('image/jpeg', 0.92);
    this.erroCaptura = '';
  }

  confirmarCaptura(): void {
    if (!this.quadro) return;
    this.quadro.toBlob(blob => {
      if (!blob) {
        this.erroCaptura = 'Não foi possível gerar a foto.';
        this.cd.detectChanges();
        return;
      }
      this.fotoSelecionada.emit(new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      this.fecharCaptura();
      this.cd.detectChanges();
    }, 'image/jpeg', 0.92);
  }

  fecharCaptura(): void {
    this.pedidoCamera++;
    this.encerrarCamera();
    this.capturaAberta = false;
    this.cameraPronta = false;
    this.erroCaptura = '';
    this.fotoCapturada = null;
    this.quadro = null;
  }

  private fecharMenuFoto(focarGatilho = false): void {
    if (!this.menuFotoAberto) return;
    this.menuFotoAberto = false;
    if (focarGatilho) this.gatilhoFoto?.nativeElement.focus();
  }

  private focarItemMenu(indice: number): void {
    this.itensMenu()[indice]?.focus();
  }

  private itensMenu(): HTMLButtonElement[] {
    const raiz = this.menuFoto?.nativeElement;
    if (!raiz) return [];
    return Array.from(raiz.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
  }

  private async iniciarCamera(deviceId?: string): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.erroCaptura = 'Este navegador não permite acessar a câmera neste endereço.';
      this.cd.detectChanges();
      return;
    }
    const pedido = ++this.pedidoCamera;
    this.encerrarCamera();
    this.cameraPronta = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      if (pedido !== this.pedidoCamera || !this.capturaAberta) {
        stream.getTracks().forEach(trilha => trilha.stop());
        return;
      }
      this.stream = stream;
      const lista = await navigator.mediaDevices.enumerateDevices();
      this.dispositivos = lista.filter(item => item.kind === 'videoinput');
      this.dispositivoId = this.stream.getVideoTracks()[0]?.getSettings().deviceId
        || deviceId
        || this.dispositivos[0]?.deviceId
        || '';
      const elemento = this.preview?.nativeElement;
      if (elemento) {
        elemento.srcObject = this.stream;
        await elemento.play().catch(() => undefined);
      }
      this.cameraPronta = true;
    } catch (erro) {
      if (pedido !== this.pedidoCamera || !this.capturaAberta) return;
      this.erroCaptura = mensagemErroCamera(erro);
    }
    if (pedido !== this.pedidoCamera || !this.capturaAberta) return;
    this.cd.detectChanges();
  }

  private encerrarCamera(): void {
    this.stream?.getTracks().forEach(trilha => trilha.stop());
    this.stream = null;
    const elemento = this.preview?.nativeElement;
    if (elemento) elemento.srcObject = null;
  }
}
