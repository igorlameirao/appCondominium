import { Condominio } from './condominio.model';

/** Formata o domínio para exibição na listagem (sem alterar o valor persistido). */
export function condominioDominioExibicao(item: Condominio): string {
  const raw = item.dominio?.trim();
  if (!raw) return '';

  let s = raw;
  const lower = s.toLowerCase();
  if (lower.startsWith('https://')) s = s.slice(8);
  else if (lower.startsWith('http://')) s = s.slice(7);

  return s.replace(/\/+$/, '');
}
