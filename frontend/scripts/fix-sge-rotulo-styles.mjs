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

let count = 0;
for (const file of walk(path.resolve('src/app/features'), '-list.component.ts')) {
  let s = fs.readFileSync(file, 'utf8');
  const n = s;
  s = s.replace(/\[rotulo\]="(.+?)"\s+\[pagina\]/g, 'rotulo="$1" [pagina]');
  if (s !== n) {
    fs.writeFileSync(file, s);
    count++;
  }
}
console.log('rotulo fixed', count);
