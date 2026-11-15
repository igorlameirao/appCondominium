/**
 * Impede regressão no carregamento da edição de Banco (paramMap x rota Angular).
 */
import fs from 'fs';
import path from 'path';

const appRoutes = fs.readFileSync(path.resolve('src/app/app.routes.ts'), 'utf8');
const generated = fs.readFileSync(path.resolve('src/app/entity-routes.generated.ts'), 'utf8');
const form = fs.readFileSync(
  path.resolve('src/app/features/banco/banco-form.component.ts'),
  'utf8',
);

const errors = [];
const expectedParam = 'codigoBanco';

if (!form.includes(`paramMap.get('${expectedParam}')`)) {
  errors.push(`banco-form deve ler paramMap.get('${expectedParam}')`);
}

const appEditRoute = /path:\s*'banco\/:([^']+)'/.exec(appRoutes);
if (!appEditRoute || appEditRoute[1] !== expectedParam) {
  errors.push(
    `app.routes.ts deve declarar path 'banco/:${expectedParam}' (atual: ${
      appEditRoute ? `banco/:${appEditRoute[1]}` : 'não encontrada'
    })`,
  );
}

const genEditRoute = /path:\s*'banco\/\{([^}]+)\}'/.exec(generated);
if (!genEditRoute || genEditRoute[1] !== expectedParam) {
  errors.push(`entity-routes.generated.ts deve usar banco/{${expectedParam}}`);
}

if (errors.length) {
  console.error('Verificação de rotas de Banco falhou:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}

console.log('OK: rotas de edição de Banco alinhadas com o formulário.');