import { NgForm } from '@angular/forms';

/** Indica pendências (controles inválidos) em um subconjunto nomeado do NgForm. */
export function abaTemPendenciasFormulario(
  form: NgForm | null | undefined,
  nomesCampos: ReadonlySet<string>,
  extraInvalido?: () => boolean,
): boolean {
  if (extraInvalido?.()) return true;
  if (!form) return false;
  for (const nome of nomesCampos) {
    const controle = form.controls[nome];
    if (controle?.invalid) return true;
  }
  return false;
}
