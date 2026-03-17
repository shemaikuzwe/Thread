#!/bin/sh
set -e

MAX_ATTEMPTS=3
SLEEP_SECONDS=30
ENV_FILE="/app/.env"

if [ -f "$ENV_FILE" ]; then
  # Export variables from the mounted env file for this shell and child processes.
  set -a
  . "$ENV_FILE"
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set."
  exit 1
fi
# Wait for db to start
sleep "$SLEEP_SECONDS"
attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "Running drizzle migrate (attempt $attempt/$MAX_ATTEMPTS)..."
  if npx drizzle-kit migrate ; then
    echo "Drizzle migrate deploy succeeded."
    break
  fi

  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    echo "Drizzle migrate deploy failed. Retrying in ${SLEEP_SECONDS}s..."
    sleep "$SLEEP_SECONDS"
  else
    echo "Drizle migrate deploy failed after ${MAX_ATTEMPTS} attempts."
    exit 1
  fi

  attempt=$((attempt + 1))
done

exec "$@"
