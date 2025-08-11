#!/usr/bin/env bash
set -euo pipefail

# Clean ai/archive of common code files (ts, js, tsx, jsx, json, md)
ARCHIVE_DIR="ai/archive"

if [ ! -d "$ARCHIVE_DIR" ]; then
  echo "No $ARCHIVE_DIR directory found; nothing to clean."
  exit 0
fi

# Remove files but keep folders intact
find "$ARCHIVE_DIR" -type f \( \
  -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" \
\) -print -delete

# Optionally remove empty directories left behind
find "$ARCHIVE_DIR" -type d -empty -print -delete || true

echo "Cleaned $ARCHIVE_DIR."
