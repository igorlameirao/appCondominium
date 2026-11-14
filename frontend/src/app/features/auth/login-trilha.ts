/** Deslizamento lateral compartilhado pelos logins genérico e por tenant. */
export class LoginTrilha {
  passos: string[] = ['LOGIN'];
  atual = 'LOGIN';
  animando = false;
  semTransicao = false;

  private geracao = 0;
  private focoTimer = 0;
  private destruido = false;
  private elemento?: HTMLElement;

  constructor(private readonly detectar: () => void) {}

  get deslocamento(): string {
    return `-${this.indice * 100}%`;
  }

  get indice(): number {
    const indice = this.passos.indexOf(this.atual);
    return indice < 0 ? 0 : indice;
  }

  anexar(el: HTMLElement): void {
    this.elemento = el;
  }

  destruir(): void {
    this.destruido = true;
    this.geracao++;
    if (this.focoTimer) clearTimeout(this.focoTimer);
  }

  podeVoltar(): boolean {
    return !this.animando && this.indice > 0;
  }

  irPara(destino: string, passos: readonly string[]): void {
    if (this.destruido || (destino === this.atual && mesmaTrilha(this.passos, passos))) return;
    const geracao = ++this.geracao;
    if (this.focoTimer) {
      clearTimeout(this.focoTimer);
      this.focoTimer = 0;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.semTransicao = true;
      this.animando = false;
      this.passos = [...passos];
      this.atual = destino;
      this.detectar();
      this.semTransicao = false;
      this.focarCampoAtivo();
      return;
    }

    this.semTransicao = true;
    this.animando = true;
    this.passos = [...passos];
    this.detectar();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.destruido || geracao !== this.geracao) return;
        this.semTransicao = false;
        this.atual = destino;
        this.detectar();
        this.focoTimer = window.setTimeout(() => {
          if (geracao !== this.geracao) return;
          this.concluirAnimacao();
        }, 700);
      });
    });
  }

  aoFimTransicao(event: TransitionEvent): void {
    if (!this.animando || this.semTransicao) return;
    if (event.propertyName !== 'margin-left') return;
    if (event.target !== this.elemento) return;
    this.concluirAnimacao();
  }

  private concluirAnimacao(): void {
    if (!this.animando) return;
    this.animando = false;
    if (this.focoTimer) {
      clearTimeout(this.focoTimer);
      this.focoTimer = 0;
    }
    this.detectar();
    this.focarCampoAtivo();
  }

  private focarCampoAtivo(): void {
    const secoes = this.elemento?.querySelectorAll<HTMLElement>('.login-step');
    secoes?.[this.indice]?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
  }
}

function mesmaTrilha(atual: readonly string[], proxima: readonly string[]): boolean {
  return atual.length === proxima.length && atual.every((passo, i) => passo === proxima[i]);
}
