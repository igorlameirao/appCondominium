import fs from 'fs';
import path from 'path';

const ICONS = {
  banco: 'landmark', municipio: 'map-pin', bairro: 'building', uf: 'map-pin', endereco: 'map-pin',
  condominio: 'building', configuracaocondominio: 'layers', bloco: 'building', tipounidade: 'layers',
  unidade: 'building', hidrometro: 'layers', consumoagua: 'layers', pessoafisica: 'user',
  pessoajuridica: 'briefcase', pessoacondominio: 'users', fornecedor: 'briefcase', cobranca: 'wallet',
  dadosbancarios: 'landmark', despesa: 'wallet', tipodespesa: 'layers', material: 'layers',
  alocacaomaterial: 'layers', estoquematerialconsumo: 'layers', entradasaidamaterialconsumo: 'layers',
  concorrencia: 'file-text', ofertaconcorrencia: 'file-text', guardaencomenda: 'layers',
  local: 'map-pin', aluguelequipamento: 'layers', equipamento: 'layers', atividadeeconomica: 'briefcase',
  tipoatividadeeconomica: 'briefcase', tipomaterial: 'layers', tipomaterialcondominio: 'layers',
};

function walkForms(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkForms(full, acc);
    else if (name.endsWith('-form.component.ts')) acc.push(full);
  }
  return acc;
}

function entityKey(file) {
  return path.basename(path.dirname(file));
}

function extractBlocks(src, filePath) {
  const titleM = src.match(/<h2>\{\{ isEdit \? 'Editar' : 'Novo' \}\} ([^<]+)<\/h2>/)
    ?? src.match(/<h2>\{\{ isEdit \? 'Editar' : 'Nova' \}\} ([^<]+)<\/h2>/);
  const entityLabel = titleM ? titleM[1].trim() : 'Registro';

  const formScroll = src.match(/<div class="form-scroll">([\s\S]*?)<\/div>\s*<div class="actions form-actions">/);
  const actions = src.match(/<div class="actions form-actions">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="confirm-overlay"/);
  const confirm = src.match(/<div class="confirm-overlay"[\s\S]*?<\/div>\s*<\/div>\s*<app-list-loading-modal[\s\S]*?\/>/);
  const loading = src.match(/<app-list-loading-modal[^/]*\/>/);

  return { entityLabel, formScroll: formScroll?.[1] ?? '', actions: actions?.[0] ?? '', confirm: confirm?.[0] ?? '', loading: loading?.[0] ?? '' };
}

function buildTemplate(meta, icon, pluralRoute) {
  const { entityLabel, formScroll, actions, confirm, loading } = meta;
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
          ${actions.trim()}
        </section>
      </div>
    </div>
    ${confirm ? confirm.trim() : ''}
    ${loading ? loading.trim() : ''}
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
  src = src.replace(
    /imports: \[CommonModule,/,
    'imports: [CommonModule, RouterLink, Icone,'
  );
  src = src.replace(/\s*host: \{ class: 'form-page[^']*' \},\n/, '\n');
  if (!src.includes('cad-acoes')) {
    src = src.replace(/class="actions form-actions"/g, 'class="actions form-actions cad-acoes"');
    src = src.replace(
      /(<button type="button" class="btn-cancelar"[^>]*>Voltar<\/button>)/,
      '<span class="cad-acoes__espaco"></span>\n        $1'
    );
  }
  if (!src.includes("Salvar")) {
    src = src.replace(/>Gravar</g, '>Salvar<');
    src = src.replace(/'Gravar'/g, "'Salvar'");
  }
  return src.replace(/\n/g, '\r\n');
}

for (const file of walkForms(path.resolve('src/app/features'))) {
  let src = fs.readFileSync(file, 'utf8');
  const key = entityKey(file);
  const icon = ICONS[key] ?? 'building';
  const route = '/' + key;
  const meta = extractBlocks(src, file);
  const tpl = buildTemplate(meta, icon, route);
  if (!meta.formScroll) {
    console.error('skip form', file);
    continue;
  }
  src = src.replace(/template: `[\s\S]*?`\s*,?\n/, `template: \`${tpl}\`,\n`);
  src = patchImports(src);
  fs.writeFileSync(file, src);
  console.log('ok', path.basename(file));
}
