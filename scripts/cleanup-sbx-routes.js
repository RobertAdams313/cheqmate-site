const fs=require('fs');const p='api/index.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace(/import sbxExchangeRaw.*\n?/,'')
   .replace(/import sbxExchange.*\n?/,'')
   .replace(/import sbxLinkToken.*\n?/,'')
   .replace(/if\s*\(pathname\s*===\s*'\/sbx-exchange-raw'[\s\S]*?\}\s*catch\s*\([\s\S]*?\}\s*/,'')
   .replace(/if\s*\(pathname\s*===\s*'\/sbx-exchange'[\s\S]*?\}\s*catch\s*\([\s\S]*?\}\s*/,'')
   .replace(/if\s*\(pathname\s*===\s*'\/sbx-link-token'[\s\S]*?\}\s*catch\s*\([\s\S]*?\}\s*/,'');
fs.writeFileSync(p,s);console.log('✅ cleaned sbx routes from api/index.ts');
