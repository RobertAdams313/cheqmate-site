#!/usr/bin/env bash
set -euo pipefail

PREVIEW="${PREVIEW:-https://cheqmate-site-r3zsvocqr-robert-adams-projects-fcca196e.vercel.app}"
BYPASS="${BYPASS:-pWjl58MNaNwJLChaxu8stfiTk52FP4Cq}"

# Set bypass cookie
curl -sS -D - -c cookies.txt \
  "$PREVIEW/api/no-such-endpoint?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=$BYPASS" \
  -o /dev/null >/dev/null

echo "404 check:" && curl -sS -b cookies.txt "$PREVIEW/api/no-such-endpoint" | jq
echo "debug-plaid:" && curl -sS -b cookies.txt "$PREVIEW/api/debug-plaid?env=sandbox" | jq

ACCESS_TOKEN="$(curl -sS -b cookies.txt -X POST "$PREVIEW/api/sandbox-access-token" \
  -H "Content-Type: application/json" \
  -d '{"initial_products":["transactions"]}' | jq -r '.access_token')"
echo "ACCESS_TOKEN=${ACCESS_TOKEN}"

echo "recurring/list:" && curl -sS -b cookies.txt -X POST "$PREVIEW/api/recurring/list" \
  -H "Content-Type: application/json" \
  -d "{\"access_token\":\"$ACCESS_TOKEN\"}" | jq

echo "item/remove:" && curl -sS -b cookies.txt -X POST "$PREVIEW/api/item/remove" \
  -H "Content-Type: application/json" \
  -d "{\"access_token\":\"$ACCESS_TOKEN\"}" | jq
