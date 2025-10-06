const fs = require('fs');
const path = 'api/_handlers/sbx-link-token.ts';
let s = fs.readFileSync(path, 'utf8');
let changed = false;

// 1) Ensure Products is imported from 'plaid'
if (!/from 'plaid'[^;]*Products/.test(s)) {
  s = s.replace(
    /from 'plaid';/,
    (m) => m.replace("from 'plaid';", "from 'plaid';") // placeholder
  );
  s = s.replace(
    /import\s*{\s*([^}]+)\s*}\s*from 'plaid';/,
    (_, names) => {
      const parts = names.split(',').map(x => x.trim());
      if (!parts.includes('Products')) parts.push('Products');
      return `import { ${parts.join(', ')} } from 'plaid';`;
    }
  );
  changed = true;
}

// 2) Ensure base LinkTokenCreateRequest has products for add-mode
if (!/const\s+base:\s*LinkTokenCreateRequest\s*=\s*\{[\s\S]*products:/.test(s)) {
  s = s.replace(
    /const\s+base:\s*LinkTokenCreateRequest\s*=\s*\{\s*([\s\S]*?)\n\s*\};/,
    (m, inner) => {
      // insert products after client_name
      let updated = inner;
      // If there's already a client_name line, we can inject after it;
      // otherwise inject near the top safely.
      if (/client_name\s*:/.test(updated)) {
        updated = updated.replace(/(client_name\s*:\s*['"].+?['"].*?,\s*\n)/,
          `$1      products: [Products.Transactions],\n`);
      } else {
        updated = `      products: [Products.Transactions],\n` + updated;
      }
      return `const base: LinkTokenCreateRequest = {\n${updated}\n    };`;
    }
  );
  changed = true;
}

fs.writeFileSync(path, s);
console.log(changed ? '✅ sbx-link-token: added Products import and products: [Products.Transactions]' :
                      'ℹ️ sbx-link-token already has products & Products import');
