#!/usr/bin/env bash
# מוריד את כל התמונות מאתר היזם לתיקייה assets/img ומעדכן את הדף לשימוש מקומי.
# הרץ מהמחשב שלך (לא מהענן): bash scripts/localize-assets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="https://crp.co.il/wp-content/uploads/2026/02/"
mkdir -p assets/img
grep -oE "${BASE}[A-Za-z0-9_.-]+" index.html | sort -u | while read -r url; do
  f="assets/img/${url##*/}"
  [ -f "$f" ] || { echo "⬇ $f"; curl -sSL "$url" -o "$f"; }
done
sed -i.bak "s#${BASE}#assets/img/#g" index.html && rm -f index.html.bak
sed -i.bak "s#assetBase: \"${BASE}\"#assetBase: \"assets/img/\"#" js/config.js && rm -f js/config.js.bak
echo "✓ התמונות הועתקו ל-assets/img והדף עודכן."
