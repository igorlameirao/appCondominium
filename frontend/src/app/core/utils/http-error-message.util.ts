/** Mensagem curta para toast a partir de falha HTTP (evita exibir stack trace). */
export function mensagemErroHttp(erro: unknown, fallback = 'Não foi possível salvar. Tente novamente.'): string {
  const e = erro as { error?: unknown; message?: string };
  const body = e?.error;

  if (typeof body === 'string') {
    if (textoIndicaTipoUnidadeDuplicado(body)) {
      return 'Já existe um tipo de unidade com esta descrição neste condomínio.';
    }
    if (body.includes('Duplicate entry') || body.includes('DbUpdateException') || body.length > 280) {
      return fallback;
    }
    const curto = body.trim();
    if (curto) return curto;
  }

  if (body && typeof body === 'object') {
    const o = body as { message?: string; title?: string };
    const msg = o.message ?? o.title;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }

  const eHttp = erro as { status?: number };
  if (eHttp.status === 403) return 'Sem permissão para gravar arquivos nesta funcionalidade.';
  if (eHttp.status === 503) return 'Armazenamento S3 não configurado neste ambiente.';
  if (eHttp.status === 502) return 'Não foi possível gravar o arquivo no S3. Verifique credenciais e permissões do bucket.';

  if (typeof e?.message === 'string' && e.message.trim() && !e.message.startsWith('Http failure')) {
    return e.message.trim();
  }

  return fallback;
}

function textoIndicaTipoUnidadeDuplicado(texto: string): boolean {
  return texto.includes('IdxCKTipoUnidade') ||
    (texto.includes('Duplicate entry') && texto.toLowerCase().includes('tipounidade'));
}
