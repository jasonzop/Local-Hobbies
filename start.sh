#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting PostgreSQL..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

echo "Starting the Spring API..."
(
  cd "$ROOT_DIR/apps/api"
  ./gradlew bootRun
) &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Waiting for the API..."
for _ in {1..30}; do
  if curl --silent --fail http://localhost:8080/health >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl --silent --fail http://localhost:8080/health >/dev/null; then
  echo "The API did not become healthy. Check the backend output above."
  exit 1
fi

echo "Starting Expo..."
cd "$ROOT_DIR/apps/mobile"
npm install
npx expo start -c
