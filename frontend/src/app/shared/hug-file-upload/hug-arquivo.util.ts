/** Classificação de pré-visualização Hug (imagem ou PDF). */
export type HugArquivoPreviewTipo = 'imagem' | 'pdf';

const EXTENSOES_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export function extensaoArquivo(nome?: string | null): string {
  if (!nome || !nome.includes('.')) return '';
  return nome.slice(nome.lastIndexOf('.')).toLowerCase();
}

export function inferirMimeArquivo(mime?: string | null, nomeArquivo?: string | null): string | null {
  const tipo = (mime || '').trim().toLowerCase();
  if (tipo && tipo !== 'application/octet-stream') return tipo;
  const ext = extensaoArquivo(nomeArquivo);
  if (ext && EXTENSOES_MIME[ext]) return EXTENSOES_MIME[ext];
  return tipo || null;
}

export function classificarArquivoPreview(
  mime?: string | null,
  nomeArquivo?: string | null,
): HugArquivoPreviewTipo | null {
  const resolvido = inferirMimeArquivo(mime, nomeArquivo);
  if (!resolvido) return null;
  if (resolvido === 'application/pdf') return 'pdf';
  if (resolvido.startsWith('image/')) return 'imagem';
  return null;
}

export function arquivoAceitoPeloAccept(arquivo: File, accept: string): boolean {
  const partes = accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!partes.length) return true;
  const tipo = (arquivo.type || '').toLowerCase();
  if (tipo && partes.includes(tipo)) return true;
  const ext = extensaoArquivo(arquivo.name);
  if (ext && partes.includes(EXTENSOES_MIME[ext] ?? '')) return true;
  return false;
}

/** Garante Blob com MIME adequado (ex.: resposta da API como octet-stream). */
export function blobComTipo(blob: Blob, mime: string): Blob {
  const alvo = mime.trim().toLowerCase();
  const atual = (blob.type || '').trim().toLowerCase();
  if (atual && atual !== 'application/octet-stream' && atual === alvo) return blob;
  return new Blob([blob], { type: alvo });
}

export function mimeArquivoLocal(arquivo: File): string {
  return inferirMimeArquivo(arquivo.type, arquivo.name) || arquivo.type || 'application/octet-stream';
}
