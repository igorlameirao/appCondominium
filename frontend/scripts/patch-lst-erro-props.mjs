import fs from 'fs';
import path from 'path';

const features = path.resolve('src/app/features');

function walkLists(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walkLists(full, acc);
    else if (name.endsWith('-list.component.ts')) acc.push(full);
  }
  return acc;
}

for (const file of walkLists(features)) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('erroCarregamento') && !src.includes('finalizarCarregamentoLista')) continue;
  if (src.includes('erroCarregamento: string | null')) continue;

  if (src.includes('loading = false;')) {
    src = src.replace(/loading = false;\n/, 'loading = false;\n  erroCarregamento: string | null = null;\n');
  } else {
    continue;
  }

  if (src.includes('finalizarCarregamentoLista') && !src.includes('lista-sge-erro.util')) {
    src = src.replace(
      /(import { Icone }[^\n]+\n)/,
      `$1import {\n  iniciarCarregamentoLista,\n  finalizarCarregamentoListaSucesso,\n  finalizarCarregamentoListaErro,\n} from '../../shared/lista-sge/lista-sge-erro.util';\n`
    );
  }

  fs.writeFileSync(file, src);
  console.log('prop', path.basename(file));
}