
#!/usr/bin/env bash

set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
BEARER="${BEARER:-test-token}"

curl -s -X POST "$BASE/api/ai/rewrite" \
  -H "Authorization: Bearer $BEARER" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[
      {"index":0,"title":"↑ Groceries trending up","current":"Adjust timing or amount and trim ~$15 this period."},
      {"index":1,"title":"On-time payments","current":"Consider autopay for one fixed bill to reduce mental load."}
    ]
  }' | jq
