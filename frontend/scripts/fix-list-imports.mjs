import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const featuresDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/app/features');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (ent.name.endsWith('-list.component.ts')) out.push(full);
  }
  return [...new Set(out)];
}

const extra = `import { PermissionService } from '../../core/services/permission.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmarExclusaoComponent } from '../../shared/confirmar-exclusao/confirmar-exclusao.component';`;

for (const f of walk(featuresDir)) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes("from '../../core/services/permission.service'")) {
    s = s.replace(/(import .+ from '\.\/[^']+\.model';)/, `$1\n${extra}`);
    fs.writeFileSync(f, s);
    console.log('fixed', path.relative(featuresDir, f));
  }
}
