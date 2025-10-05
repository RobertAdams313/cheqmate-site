const fs = require('fs');
const p = 'api/index.ts';
let t = fs.readFileSync(p, 'utf8');

function addRoute(name){
  const entry = `'/` + name + `': () => import('./_handlers/` + name + `.js'),`;
  if (t.includes(`'/${name}'`)) return;
  t = t.replace(/const\s+map\s*:[^{]*\{/, m => m + '\n  ' + entry);
}
addRoute('blob-debug');
addRoute('blob-write-test');

fs.writeFileSync(p, t);
console.log('✅ Mapped routes: /blob-debug, /blob-write-test');
