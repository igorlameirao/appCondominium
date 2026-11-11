import fs from 'fs';
import path from 'path';

function walk(dir, suffix, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, suffix, acc);
    else if (name.endsWith(suffix)) acc.push(full);
  }
  return acc;
}

const features = path.resolve('src/app/features');

for (const file of walk(features, '-form.component.ts')) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  s = s.replace(
    /      <\/div>\r?\n    <\/div>\r?\n    <div class="confirm-overlay"\r?\n        <\/section>\r?\n      <\/div>\r?\n    <\/div>\r?\n/,
    '      </div>\r\n        </section>\r\n      </div>\r\n    </div>\r\n'
  );
  const load = '<app-list-loading-modal [visible]="pageLoad.loading" message="Aguarde, carregando..." [delayMs]="0" />';
  const dup = load + '\r\n    ' + load;
  if (s.includes(dup)) s = s.replace(dup, load);
  if (s !== orig) {
    fs.writeFileSync(file, s);
    console.log('fixed form', path.basename(file));
  }
}

// fix viewport util
const util = path.resolve('src/app/shared/lista-sge/lista-sge-viewport.util.ts');
let u = fs.readFileSync(util, 'utf8');
u = u.replace(/for \(const filho of painel\.children\)/g, 'for (const filho of Array.from(painel.children))');
u = u.replace(/for \(const filho of parent\.children\)/g, 'for (const filho of Array.from(parent.children))');
fs.writeFileSync(util, u);
