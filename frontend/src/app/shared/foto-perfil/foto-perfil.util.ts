export const FOTO_PERFIL_TIPOS = ['image/jpeg', 'image/png'] as const;
export const FOTO_PERFIL_TAMANHO_MAXIMO = 2 * 1024 * 1024;

export function validarArquivoFotoPerfil(arquivo: File): string | null {
  if (!FOTO_PERFIL_TIPOS.includes(arquivo.type as (typeof FOTO_PERFIL_TIPOS)[number])) {
    return 'Formato inválido. Use JPG ou PNG.';
  }
  if (arquivo.size > FOTO_PERFIL_TAMANHO_MAXIMO) {
    return 'A imagem deve ter no máximo 2 MB.';
  }
  return null;
}

export function iniciaisDeNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (partes[0][0] + ultima).toUpperCase();
}

export function mensagemErroCamera(erro: unknown): string {
  const nome = erro instanceof DOMException ? erro.name : '';
  if (nome === 'NotAllowedError' || nome === 'PermissionDeniedError') {
    return 'Permissão da câmera negada. Autorize o acesso no navegador e tente novamente.';
  }
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError') {
    return 'Nenhum periférico de vídeo foi encontrado.';
  }
  if (nome === 'NotReadableError' || nome === 'TrackStartError') {
    return 'O periférico está em uso ou não pôde ser aberto.';
  }
  if (nome === 'OverconstrainedError') {
    return 'Não foi possível usar o periférico selecionado.';
  }
  return 'Não foi possível acessar a câmera.';
}
