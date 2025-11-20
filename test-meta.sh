#!/bin/bash

echo "🔍 Starting OG + Meta + Preview/Copy verification..."

if [ -z "$1" ]; then
  echo "❌ Usage: ./test-meta.sh <FULL_PAYMENT_URL>"
  exit 1
fi

URL="$1"

echo "📡 Fetching metadata from:"
echo "$URL"
echo "---------------------------------------"

# Download HEAD of page
HTML=$(curl -s -L "$URL")

# Extract helper function
extract() {
  echo "$HTML" | grep -i "$1" | head -n 1 | sed 's/.*content="//;s/".*//'
}

# ⬇ Extract meta fields
OG_TITLE=$(extract "og:title")
OG_DESC=$(extract "og:description")
OG_IMAGE=$(extract "og:image")

TW_TITLE=$(extract "twitter:title")
TW_DESC=$(extract "twitter:description")
TW_IMAGE=$(extract "twitter:image")

# Check Preview / Copy buttons
PREVIEW_URL=$(echo "$HTML" | grep -i "preview-link" | head -n 1 | sed 's/.*href="//;s/".*//')
COPY_URL=$(echo "$HTML" | grep -i "copy-link" | head -n 1 | sed 's/.*href="//;s/".*//')

echo ""
echo "================ META RESULT ================"
echo "📌 OG Title:        $OG_TITLE"
echo "📌 OG Description:  $OG_DESC"
echo "📌 OG Image:        $OG_IMAGE"
echo ""
echo "🐦 Twitter Title:   $TW_TITLE"
echo "🐦 Twitter Desc:    $TW_DESC"
echo "🐦 Twitter Image:   $TW_IMAGE"
echo ""
echo "🔗 Preview URL:     $PREVIEW_URL"
echo "🔗 Copy URL:        $COPY_URL"
echo "============================================="

echo ""
echo "✔ CHECKS -----------------------------------"

# Title check
if [[ "$OG_TITLE" != "" ]]; then
  echo "✔ OG Title: PASS"
else
  echo "❌ OG Title: FAIL"
fi

# Description check
if [[ "$OG_DESC" != "" ]]; then
  echo "✔ OG Description: PASS"
else
  echo "❌ OG Description: FAIL"
fi

# Image check
if [[ "$OG_IMAGE" == *"http"* ]]; then
  echo "✔ OG Image: PASS"
else
  echo "❌ OG Image: FAIL"
fi

# Preview / Copy match check
if [[ "$PREVIEW_URL" == "$COPY_URL" ]]; then
  echo "✔ Preview/Copy URLs MATCH ✓"
else
  echo "❌ Preview/Copy URLs DO NOT MATCH ✗"
fi

echo ""
echo "🎉 Verification completed."
