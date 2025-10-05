#!/usr/bin/env bash
set -e

BASE="https://cheqmateios.app"

echo "404 check:" && curl -s "$BASE/api/no-such-endpoint" | jq
echo "recurring/list:" && curl -s -X POST "$BASE/api/recurring/list" | jq
echo "accounts/set-enabled:" && curl -s -X POST "$BASE/api/accounts/set-enabled" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"abc","enabled":true}' | jq
echo "item/remove:" && curl -s -X POST "$BASE/api/item/remove" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"abc"}' | jq
echo "plaid/return:" && curl -s "$BASE/plaid/return" | jq
