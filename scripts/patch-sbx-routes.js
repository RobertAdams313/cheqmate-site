const fs=require('fs');const path='api/index.ts';
let s=fs.readFileSync(path,'utf8');let changed=false;

// Add imports
if(!s.includes("_handlers/sbx-exchange")){
  const m=s.match(/^(?:import[^\n]*\n)+/m);
  s = m ? s.replace(m[0], m[0] + "import sbxExchange from './_handlers/sbx-exchange';\n")
        : "import sbxExchange from './_handlers/sbx-exchange';\n"+s;
  changed=true;
}
if(!s.includes("_handlers/sbx-link-token")){
  const m=s.match(/^(?:import[^\n]*\n)+/m);
  s = m ? s.replace(m[0], m[0] + "import sbxLinkToken from './_handlers/sbx-link-token';\n")
        : "import sbxLinkToken from './_handlers/sbx-link-token';\n"+s;
  changed=true;
}

// Add early branches
const re=/(export\s+default\s+async\s+function\s+handler\s*\([^)]*\)\s*\{)/;
if(re.test(s) && !s.includes("pathname === '/sbx-exchange'")){
  s=s.replace(re, `$1
  // Sandbox smoke tests (no device required)
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const pathname = urlObj.pathname.replace(/^\\/api/, '');
    if (pathname === '/sbx-exchange')   { return await sbxExchange(req, res); }
    if (pathname === '/sbx-link-token') { return await sbxLinkToken(req, res); }
  } catch (_e) { /* noop */ }
`);
  changed=true;
}

fs.writeFileSync(path,s);console.log(changed?'✅ patched api/index.ts for /api/sbx-* routes':'ℹ️ already has /api/sbx-* routes');
