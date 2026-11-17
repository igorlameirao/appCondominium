import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Redireciona rotas legadas de edição PF/PJ para o hub Pessoas. */
@Component({
  selector: 'app-pessoa-edit-redirect',
  standalone: true,
  template: '<p class="lst-vazio" role="status">Carregando cadastro…</p>',
})
export class PessoaEditRedirectComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('idPessoa');
    const tipo = this.route.snapshot.data['tipoPessoa'] as 'PF' | 'PJ';
    if (id) {
      void this.router.navigate(['/pessoas', id], { queryParams: { tipo }, replaceUrl: true });
    } else {
      void this.router.navigate(['/pessoas'], { replaceUrl: true });
    }
  }
}