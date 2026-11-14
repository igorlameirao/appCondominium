import fs from 'fs';
import path from 'path';

const ICONS = {
  pessoavinculo: 'users',
  fornecedor: 'briefcase',
  autorizacaoacessotemporario: 'key',
  pessoafisica: 'user',
  pessoajuridica: 'briefcase',
};

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('Usage: node migrate-sge-forms-subset.mjs <files...>');
  process.exit(1);
}

function extractBlocks(src) {
  const titleM =
    src.match(/<h2>\{\{ isEdit \? 'Editar' : 'Novo' \}\} ([^<]+)<\/h2>/) ??
    src.match(/<h2>\{\{ isEdit \? 'Editar' : 'Nova' \}\} ([^<]+)<\/h2>/) ??
    src.match(/<h2>\{\{ isEdit \? 'Editar' : 'Novo' \}\} ([^<]+)<\/h2>/);
  const entityLabel = titleM ? titleM[1].trim() : 'Registro';
  const formScroll = src.match(/<div class="form-scroll[^"]*">([\s\S]*?)<\/div>\s*<div class="actions form-actions">/);
  const actionsM = src.match(
    /<div class="actions form-actions">([\s\S]*?)<\/div>\s*(?:<div class="msg-erro"|<\/div>\s*<div class="confirm-overlay")/
  );
  const actions = actionsM ? `<div class="actions form-actions cad-acoes">${actionsM[1].trim()}</div>` : '';
  const confirm = src.match(/<div class="confirm-overlay"[\s\S]*?<\/div>\s*<\/div>/);
  return { entityLabel, formScroll: formScroll?.[1] ?? '', actions, confirm: confirm?.[0] ?? '' };
}

function buildTemplate(meta, icon, pluralRoute) {
  const { entityLabel, formScroll, actions, confirm } = meta;
  return `
    <div class="content-wrapper cad-wrapper">
      <div class="cad-page">
        <header class="cad-cabecalho">
          <nav class="cad-breadcrumb" aria-label="Navegação estrutural">
            <a routerLink="/inicio"><app-icone nome="home" [tamanho]="14" /> Início</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <a [routerLink]="'${pluralRoute}'">${entityLabel}</a>
            <app-icone class="cad-breadcrumb__sep" nome="chevron-right" [tamanho]="14" />
            <span aria-current="page">{{ isEdit ? 'Editar' : 'Novo' }}</span>
          </nav>
          <h1 class="cad-titulo">{{ isEdit ? 'Editar' : 'Novo' }} ${entityLabel}</h1>
          <p class="cad-subtitulo">Cadastre e mantenha as informações de ${entityLabel.toLowerCase()}</p>
        </header>
        <section class="cad-card form-page">
          <div class="cad-abas" role="tablist" aria-label="Seções do cadastro">
            <button type="button" role="tab" class="cad-aba cad-aba--ativa" aria-selected="true">
              <app-icone nome="${icon}" [tamanho]="16" />
              <span>Dados de ${entityLabel}</span>
            </button>
          </div>
          <div class="cad-conteudo" role="tabpanel">
            <div class="cad-secao">
              <app-icone class="cad-secao__icone" nome="${icon}" [tamanho]="26" />
              <div>
                <h2 class="cad-secao__titulo">Dados de ${entityLabel}</h2>
                <p class="cad-secao__texto">Informe as informações principais</p>
              </div>
            </div>
            <div class="form-scroll cad-form-scroll">${formScroll.trim()}</div>
          </div>
          ${actions}
        </section>
      </div>
    </div>
    ${confirm ? confirm.trim() : ''}
    <p class="msg-erro cad-erro" *ngIf="formError">{{ formError }}</p>
  `;
}

function patchImports(src) {
  src = src.replace(/\r\n/g, '\n');
  if (!src.includes('RouterLink')) {
    src = src.replace(
      "import { ActivatedRoute, Router } from '@angular/router';",
      "import { ActivatedRoute, Router, RouterLink } from '@angular/router';"
    );
  }
  if (!src.includes("from '../../shared/icone'")) {
    src = src.replace(
      "import { CommonModule } from '@angular/common';",
      "import { CommonModule } from '@angular/common';\nimport { Icone } from '../../shared/icone';"
    );
  }
  src = src.replace(/imports: \[CommonModule,/, 'imports: [CommonModule, RouterLink, Icone,');
  src = src.replace(/\s*host: \{ class: 'form-page[^']*' \},\n/, '\n');
  src = src.replace(/>Gravar</g, '>Salvar<');
  src = src.replace(
    /<button type="button" class="btn-cancelar" \(click\)="cancel\(\)">Cancelar<\/button>/g,
    '<button type="button" class="btn-cancelar" (click)="cancel()">Voltar</button>'
  );
  if (!src.includes('cad-acoes__espaco')) {
    src = src.replace(
      /(<button type="submit" class="btn-gravar"[\s\S]*?<\/button>)/,
      '$1\n        <span class="cad-acoes__espaco"></span>'
    );
  }
  return src.replace(/\n/g, '\r\n');
}

for (const file of targets) {
  let src = fs.readFileSync(file, 'utf8');
  const key = path.basename(path.dirname(file));
  const route = key === 'pessoafisica' || key === 'pessoajuridica' ? '/pessoas' : '/' + key;
  const meta = extractBlocks(src);
  if (!meta.formScroll) {
    console.error('skip form scroll', file);
    continue;
  }
  const tpl = buildTemplate(meta, ICONS[key] ?? 'building', route);
  src = src.replace(/template:\s*`[\s\S]*?`\s*,?/m, `template: \`${tpl}\`,`);
  src = src.replace(/imports: \[CommonModule, RouterLink, Icone, RouterLink, Icone,/g, 'imports: [CommonModule, RouterLink, Icone,');
  src = src.replace(/\s*styles: \[[\s\S]*?\]\n/, '\n');
  src = patchImports(src);
  fs.writeFileSync(file, src);
  console.log('ok', path.basename(file));
}