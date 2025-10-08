#!/usr/bin/env bash
set -e
BASE="https://cheqmateios.app"

echo "404 check:" && curl -s "$BASE/api/no-such-endpoint" | jq

echo "recurring/list:"
if [ -n "$ACCESS_TOKEN" ]; then
  curl -s -X POST "$BASE/api/recurring/list" \
    -H "Content-Type: application/json" \
    -d "{\"access_token\":\"$ACCESS_TOKEN\"}" | jq
else
  echo '{ "note": "Set ACCESS_TOKEN to query Plaid recurring groups" }' | jq
fi

echo "accounts/set-enabled:" && curl -s -X POST "$BASE/api/accounts/set-enabled" \
  -H "Content-Type: application/json" -d '{"item_id":"abc","enabled":true}' | jq

echo "item/remove:"
if [ -n "$ACCESS_TOKEN" ]; then
  curl -s -X POST "$BASE/api/item/remove" \
    -H "Content-Type: application/json" \
    -d "{\"access_token\":\"$ACCESS_TOKEN\"}" | jq
else
  echo '{ "note": "Set ACCESS_TOKEN to test item removal" }' | jq
fi

echo "plaid/return:" && curl -s "$BASE/plaid/return" | jq
