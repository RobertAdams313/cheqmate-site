const fs = require('fs');
const p = 'api/index.ts';
let t = fs.readFileSync(p, 'utf8');

function addRoute(name) {
  if (!t.includes(`'/${name}'`)) {
    t = t.replace(/const\s+map\s*:[^{]*\{/, m => `${m}\n  '/${name}': () => import('./_handlers/${name}.js'),`);
  }
}
addRoute('blob-debug');
addRoute('blob-write-test');

fs.writeFileSync(p, t);
console.log('Mapped routes: /blob-debug, /blob-write-test');
