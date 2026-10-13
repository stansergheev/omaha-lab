#!/bin/bash
# Full build: bundle the photo reader, assemble the pages, then build the APK.
set -euo pipefail
cd "$(dirname "$0")"
(cd web/reader && npm ci --silent && npm run --silent build)
python3 tools/assemble.py
android/build.sh
