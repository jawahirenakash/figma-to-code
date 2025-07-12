#!/bin/bash

# Simple test script for Figma API (no jq required)
# Usage: ./test-figma-simple.sh YOUR_FIGMA_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./test-figma-simple.sh YOUR_FIGMA_ACCESS_TOKEN"
    echo ""
    echo "To get your access token:"
    echo "1. Visit: https://figma-to-code-backend.onrender.com/api/figma/oauth/login"
    echo "2. Complete OAuth flow"
    echo "3. Copy the access_token from the URL"
    exit 1
fi

ACCESS_TOKEN="$1"
FILE_KEY="QX6UcGsyTxi5UxVJFDX3BJ"
BACKEND_URL="https://figma-to-code-backend.onrender.com"

echo "🔍 Testing Figma API for file: $FILE_KEY"
echo "📊 Backend URL: $BACKEND_URL"
echo ""

# Test 1: Get available pages
echo "📄 Step 1: Getting available pages..."
curl -s -X POST "$BACKEND_URL/api/figma/pages" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }" > pages_response.json

echo "Pages Response saved to pages_response.json"
echo ""

# Test 2: Extract all pages (to get file size)
echo "📊 Step 2: Extracting all pages to get file size..."
curl -s -X POST "$BACKEND_URL/api/figma/extract" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }" > extract_response.json

echo "Extract Response saved to extract_response.json"
echo ""

# Show file size info using grep
echo "📊 File Size Information:"
echo "File Size:"
grep -o '"fileSize":"[^"]*"' extract_response.json 2>/dev/null || echo "Not found"
echo "Node Count:"
grep -o '"nodeCount":[0-9]*' extract_response.json 2>/dev/null || echo "Not found"
echo "Processing Time:"
grep -o '"processingTime":[0-9]*' extract_response.json 2>/dev/null || echo "Not found"
echo ""

# Check for errors
if grep -q '"error"' extract_response.json; then
    echo "❌ Error detected:"
    grep -o '"error":"[^"]*"' extract_response.json
    grep -o '"details":"[^"]*"' extract_response.json
    echo ""
fi

echo "✅ API testing complete!"
echo "📁 Check pages_response.json and extract_response.json for full responses" 