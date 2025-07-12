#!/bin/bash

# Test script for Figma API
# Usage: ./test-figma-api.sh YOUR_FIGMA_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./test-figma-api.sh YOUR_FIGMA_ACCESS_TOKEN"
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
PAGES_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/pages" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

echo "Pages Response:"
echo "$PAGES_RESPONSE" | jq '.' 2>/dev/null || echo "$PAGES_RESPONSE"
echo ""

# Extract first page ID for testing
FIRST_PAGE_ID=$(echo "$PAGES_RESPONSE" | jq -r '.pages[0].id' 2>/dev/null)
if [ "$FIRST_PAGE_ID" != "null" ] && [ -n "$FIRST_PAGE_ID" ]; then
    echo "🎯 Using first page ID: $FIRST_PAGE_ID"
    echo ""
    
    # Test 2: Extract specific page
    echo "📊 Step 2: Extracting page data..."
    EXTRACT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/extract" \
      -H "Content-Type: application/json" \
      -d "{
        \"accessToken\": \"$ACCESS_TOKEN\",
        \"fileKey\": \"$FILE_KEY\",
        \"pageId\": \"$FIRST_PAGE_ID\"
      }")
    
    echo "Extract Response (showing file size info):"
    echo "$EXTRACT_RESPONSE" | jq '{fileSize, nodeCount, processingTime, ir: (.ir | length)}' 2>/dev/null || echo "$EXTRACT_RESPONSE"
    echo ""
    
    # Show full file size details
    FILE_SIZE=$(echo "$EXTRACT_RESPONSE" | jq -r '.fileSize' 2>/dev/null)
    NODE_COUNT=$(echo "$EXTRACT_RESPONSE" | jq -r '.nodeCount' 2>/dev/null)
    PROCESSING_TIME=$(echo "$EXTRACT_RESPONSE" | jq -r '.processingTime' 2>/dev/null)
    
    if [ "$FILE_SIZE" != "null" ] && [ -n "$FILE_SIZE" ]; then
        echo "📊 File Analysis Results:"
        echo "   File Size: $FILE_SIZE MB"
        echo "   Nodes Processed: $NODE_COUNT"
        echo "   Processing Time: $PROCESSING_TIME ms"
        echo ""
    fi
else
    echo "❌ Could not extract page ID from response"
    echo "Response: $PAGES_RESPONSE"
fi

# Test 3: Try extracting all pages (no pageId)
echo "🌐 Step 3: Testing extraction of all pages..."
ALL_PAGES_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/extract" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

echo "All Pages Extract Response (showing file size info):"
echo "$ALL_PAGES_RESPONSE" | jq '{fileSize, nodeCount, processingTime, ir: (.ir | length)}' 2>/dev/null || echo "$ALL_PAGES_RESPONSE"
echo ""

# Show comparison
ALL_FILE_SIZE=$(echo "$ALL_PAGES_RESPONSE" | jq -r '.fileSize' 2>/dev/null)
ALL_NODE_COUNT=$(echo "$ALL_PAGES_RESPONSE" | jq -r '.nodeCount' 2>/dev/null)
ALL_PROCESSING_TIME=$(echo "$ALL_PAGES_RESPONSE" | jq -r '.processingTime' 2>/dev/null)

if [ "$FILE_SIZE" != "null" ] && [ "$ALL_FILE_SIZE" != "null" ]; then
    echo "📊 Comparison Summary:"
    echo "   Single Page: $FILE_SIZE MB, $NODE_COUNT nodes, $PROCESSING_TIME ms"
    echo "   All Pages: $ALL_FILE_SIZE MB, $ALL_NODE_COUNT nodes, $ALL_PROCESSING_TIME ms"
    echo ""
fi

echo "✅ API testing complete!" 