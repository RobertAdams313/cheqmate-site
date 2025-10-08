const fs=require('fs');const path='api/index.ts';
let s=fs.readFileSync(path,'utf8');let changed=false;
// import
if(!s.includes("_handlers/debug-env2")){
  const m=s.match(/^(?:import[^\n]*\n)+/m);
  s = m ? s.replace(m[0], m[0] + "import debugEnv2 from './_handlers/debug-env2';\n")
        : "import debugEnv2 from './_handlers/debug-env2';\n"+s;
  changed=true;
}
// branch early inside exported handler
const re=/(export\s+default\s+async\s+function\s+handler\s*\([^)]*\)\s*\{)/;
if(re.test(s) && !s.includes("pathname === '/debug-env2'")){
  s=s.replace(re, `$1
  // Debug v2: Plaid env/redirect + blob base
  try {
    const urlObj = new URL(req.url || '', 'https://local');
    const pathname = urlObj.pathname.replace(/^\\/api/, '');
    if (pathname === '/debug-env2') { return await debugEnv2(req, res); }
  } catch (_e) { /* noop */ }
`);
  changed=true;
}
fs.writeFileSync(path,s);console.log(changed?'✅ patched api/index.ts for /api/debug-env2':'ℹ️ already has /api/debug-env2');
