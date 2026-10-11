#!/usr/bin/env bash
# Starts a throw-away server on a fresh database, runs the workflow checks, then stops it.
set -u
cd "$(dirname "$0")/.."
PORT=${PORT:-3077}; DIR=$(mktemp -d)
fuser -k "$PORT"/tcp >/dev/null 2>&1; sleep 0.5
JOBTRACKER_DATA="$DIR" PORT=$PORT NODE_ENV=production INSECURE_COOKIES=1 npx tsx server/index.ts >"$DIR/server.log" 2>&1 &
SERVER=$!
for i in $(seq 1 30); do curl -sf "localhost:$PORT/api/auth/status" >/dev/null && break; sleep 0.3; done
BASE="http://localhost:$PORT" node e2e/${1:-workflows}.mjs; CODE=$?
kill $SERVER 2>/dev/null; rm -rf "$DIR"; exit $CODE
