const fs = require('fs');
const p = 'api/index.ts';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes("'/accounts/get-enabled'")) {
  t = t.replace(/const\s+map\s*:[^{]*\{/, m =>
    m + "\n  '/accounts/get-enabled': () => import('./_handlers/accounts/get-enabled.js'),"
  );
  fs.writeFileSync(p, t);
  console.log('✅ Mapped /accounts/get-enabled');
} else {
  console.log('Already mapped');
}
