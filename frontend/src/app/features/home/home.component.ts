import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <h1>Início</h1>
    <p>Selecione uma função no menu. O que aparece depende das permissões deste condomínio.</p>
  `
})
export class HomeComponent {}
