#!/usr/bin/env bash
# Notify IndexNow (Bing, Yandex, et al.) that pages changed, for near-instant
# re-crawl. Run this AFTER a deploy whenever content changes.
#
# Usage:  ./scripts/indexnow.sh [url ...]
#   - No args: submits the homepage.
#   - Args: submits the given full URLs instead.
set -euo pipefail

KEY="99c1e10b17aa3c534742ed19eee14ef5"
HOST="tsecapital.co"

# Build the urlList JSON from args, defaulting to the homepage.
if [ "$#" -eq 0 ]; then
  set -- "https://${HOST}/"
fi
URLS=$(printf '"%s",' "$@")
URLS="[${URLS%,}]"

curl -sS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d "{\"host\":\"${HOST}\",\"key\":\"${KEY}\",\"keyLocation\":\"https://${HOST}/${KEY}.txt\",\"urlList\":${URLS}}" \
  -w '\nHTTP %{http_code}\n'
