#!/bin/bash
source .env.local

echo "▶️ Fetching new link_token..."
LINK_TOKEN=$(curl -s https://cheqmateios.app/api/link-token \
  -X POST -H "Content-Type: application/json" \
  -d '{"flow":"add"}' | jq -r '.link_token')

echo "✅ Got link_token: $LINK_TOKEN"
echo ""
echo "Next step: open CheqMate iOS, connect a bank in Plaid Link UI."
echo "After linking, Plaid will give your app a public_token (like public-production-...)."
echo "When you have that, run this:"

cat <<EOCMD

curl -s https://cheqmateios.app/api/exchange-public-token \\
  -X POST -H "Content-Type: application/json" \\
  -d '{"public_token":"<PASTE_YOUR_PUBLIC_TOKEN_HERE>"}' | jq

EOCMD
