const fs = require('fs');
const path = 'api/index.ts';
let s = fs.readFileSync(path, 'utf8');
let changed = false;

// Add import once
if (!s.includes("_handlers/sbx-exchange-raw")) {
  const m = s.match(/^(?:import[^\n]*\n)+/m);
  s = m
    ? s.replace(m[0], m[0] + "import sbxExchangeRaw from './_handlers/sbx-exchange-raw';\n")
    : "import sbxExchangeRaw from './_handlers/sbx-exchange-raw';\n" + s;
  changed = true;
}

// Add branch early in the main handler
const re = /(export\s+default\s+async\s+function\s+handler\s*\([^)]*\)\s*\{)/;
if (re.test(s) && !s.includes("pathname === '/sbx-exchange-raw'")) {
  s = s.replace(
    re,
    `$1
  // Sandbox smoke tests
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const pathname = urlObj.pathname.replace(/^\\/api/, '');
    if (pathname === '/sbx-exchange-raw') { return await sbxExchangeRaw(req, res); }
  } catch (_e) { /* noop */ }
`
  );
  changed = true;
}

fs.writeFileSync(path, s);
console.log(changed ? '✅ patched api/index.ts for /api/sbx-exchange-raw' : 'ℹ️ already wired');
