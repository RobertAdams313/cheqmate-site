const fs = require('fs');
const path = 'api/index.ts';

let src = fs.readFileSync(path, 'utf8');
let changed = false;

// 1) Ensure import
if (!src.includes("_handlers/debug-env")) {
  const m = src.match(/^(?:import[^\n]*\n)+/m);
  if (m) {
    src = src.replace(m[0], m[0] + "import debugEnv from './_handlers/debug-env';\n");
  } else {
    src = "import debugEnv from './_handlers/debug-env';\n" + src;
  }
  changed = true;
}

// 2) Inject early route guard inside exported handler
const handlerRe = /(export\s+default\s+async\s+function\s+handler\s*\([^)]*\)\s*\{)/;
if (handlerRe.test(src) && !src.includes("pathname === '/debug-env'")) {
  src = src.replace(handlerRe, `$1
  // Debug: Plaid env/redirect check
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const pathname = urlObj.pathname.replace(/^\\/api/, '');
    if (pathname === '/debug-env') { return await debugEnv(req, res); }
  } catch (_e) { /* noop */ }
`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(path, src);
  console.log('✅ api/index.ts patched for /api/debug-env');
} else {
  console.log('ℹ️ api/index.ts already includes /api/debug-env');
}
