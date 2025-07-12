#!/bin/bash

# Direct Figma API test (requires personal access token)
# Usage: ./test-figma-direct.sh YOUR_FIGMA_PERSONAL_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./test-figma-direct.sh YOUR_FIGMA_PERSONAL_ACCESS_TOKEN"
    echo ""
    echo "To get a personal access token:"
    echo "1. Go to Figma Settings > Account > Personal access tokens"
    echo "2. Create a new token with 'file_read' scope"
    echo "3. Use that token here"
    exit 1
fi

PERSONAL_TOKEN="$1"
FILE_KEY="QX6UcGsyTxi5UxVJFDX3BJ"

echo "🔍 Testing Figma API directly for file: $FILE_KEY"
echo ""

# Test direct Figma API call
echo "📊 Getting file data from Figma API..."
RESPONSE=$(curl -s -X GET "https://api.figma.com/v1/files/$FILE_KEY" \
  -H "X-Figma-Token: $PERSONAL_TOKEN")

# Save response to file
echo "$RESPONSE" > figma_direct_response.json

# Calculate response size
RESPONSE_SIZE=$(echo "$RESPONSE" | wc -c)
RESPONSE_SIZE_MB=$(echo "scale=2; $RESPONSE_SIZE / 1024 / 1024" | bc 2>/dev/null || echo "unknown")

echo "📊 Direct Figma API Results:"
echo "   Response Size: $RESPONSE_SIZE bytes ($RESPONSE_SIZE_MB MB)"
echo ""

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ Figma API Error:"
    echo "$RESPONSE" | grep -o '"message":"[^"]*"' || echo "Unknown error"
    echo ""
else
    echo "✅ Figma API call successful!"
    echo "📁 Full response saved to figma_direct_response.json"
    echo ""
    
    # Try to extract some basic info
    echo "📄 File Information:"
    echo "Document Name:"
    echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1 || echo "Not found"
    echo "Last Modified:"
    echo "$RESPONSE" | grep -o '"lastModified":"[^"]*"' || echo "Not found"
    echo "Version:"
    echo "$RESPONSE" | grep -o '"version":"[^"]*"' || echo "Not found"
    echo ""
fi 