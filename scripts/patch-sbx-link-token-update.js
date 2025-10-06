const fs = require('fs');
const path = 'api/_handlers/sbx-link-token.ts';
let s = fs.readFileSync(path, 'utf8');
let changed = false;

// 1) Expand the destructure to include access_token
if (!/access_token\s*\}/.test(s)) {
  s = s.replace(
    /const \{[^}]*flow\s*=\s*'add'[^}]*\}\s*=\s*\(req\.body[\s\S]*?\}\s*;/,
`const { flow = 'add', item_id, access_token } =
  (req.body && typeof req.body === 'object') ? req.body : {};`
  );
  changed = true;
}

// 2) Replace the update-mode branch to require access_token
if (!/MISSING_ACCESS_TOKEN/.test(s)) {
  s = s.replace(
    /if\s*\(flow\s*===\s*'update'\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?\}/,
`if (flow === 'update') {
      if (!access_token) return res.status(400).json({ error: 'MISSING_ACCESS_TOKEN' });
      reqBody = { ...base, access_token };
    } else {
      reqBody = base;
    }`
  );
  changed = true;
}

fs.writeFileSync(path, s);
console.log(changed ? '✅ patched sbx-link-token to accept access_token for update-mode'
                    : 'ℹ️ sbx-link-token already accepts access_token');
