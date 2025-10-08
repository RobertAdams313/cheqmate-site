const fs = require('fs');
const path = 'api/index.ts';
let src = fs.readFileSync(path, 'utf8');
let changed = false;
if (!src.includes("_handlers/debug-env")) {
  const m = src.match(/^(?:import[^\n]*\n)+/m);
  src = m ? src.replace(m[0], m[0] + "import debugEnv from './_handlers/debug-env';\n")
          : "import debugEnv from './_handlers/debug-env';\n" + src;
  changed = true;
}
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
fs.writeFileSync(path, src);
console.log(changed ? '✅ api/index.ts patched for /api/debug-env' : 'ℹ️ api/index.ts already includes /api/debug-env');
