#!/bin/bash

# Test script for extremely large Figma files
# Usage: ./test-extremely-large-file.sh YOUR_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "🔍 Test for Extremely Large Figma Files"
    echo "======================================="
    echo ""
    echo "File: https://www.figma.com/design/QX6UcGsyTxi5UxVJFDX3BJ/Grizzlies-Design---V2-Updated--5-june-2025-Design-System-Revision--?node-id=8182-39931"
    echo "File Key: QX6UcGsyTxi5UxVJFDX3BJ"
    echo ""
    echo "Usage: ./test-extremely-large-file.sh YOUR_ACCESS_TOKEN"
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

echo "🔍 Testing Extremely Large File Handling"
echo "========================================"
echo ""
echo "📄 File Details:"
echo "   File Key: $FILE_KEY"
echo "   Backend: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "🏥 Step 1: Backend Health Check..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
echo "   Status: $(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' || echo 'Unknown')"
echo ""

# Test 2: Try file-info endpoint (should fail with 413)
echo "📊 Step 2: Testing file-info endpoint (expected to fail)..."
FILE_INFO_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/file-info" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

if echo "$FILE_INFO_RESPONSE" | grep -q '"error"'; then
    echo "   ❌ Expected failure:"
    echo "$FILE_INFO_RESPONSE" | grep -o '"error":"[^"]*"' || echo "Unknown error"
    echo "$FILE_INFO_RESPONSE" | grep -o '"details":"[^"]*"' || echo ""
    echo ""
else
    echo "   ✅ Unexpected success!"
    echo "$FILE_INFO_RESPONSE" | grep -o '"fileSize":"[^"]*"' || echo "No file size info"
    echo ""
fi

# Test 3: Try file-metadata endpoint (should also fail)
echo "📊 Step 3: Testing file-metadata endpoint (expected to fail)..."
METADATA_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/file-metadata" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

if echo "$METADATA_RESPONSE" | grep -q '"error"'; then
    echo "   ❌ Expected failure:"
    echo "$METADATA_RESPONSE" | grep -o '"error":"[^"]*"' || echo "Unknown error"
    echo "$METADATA_RESPONSE" | grep -o '"details":"[^"]*"' || echo ""
    echo ""
else
    echo "   ✅ Unexpected success!"
    echo "$METADATA_RESPONSE" | grep -o '"name":"[^"]*"' || echo "No name info"
    echo ""
fi

# Test 4: Try new file-status endpoint (should work)
echo "📊 Step 4: Testing new file-status endpoint (should work)..."
STATUS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/file-status" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

# Save response
echo "$STATUS_RESPONSE" > file_status_response.json

if echo "$STATUS_RESPONSE" | grep -q '"error"'; then
    echo "   ❌ Status endpoint failed:"
    echo "$STATUS_RESPONSE" | grep -o '"error":"[^"]*"' || echo "Unknown error"
    echo "$STATUS_RESPONSE" | grep -o '"details":"[^"]*"' || echo ""
    echo ""
else
    echo "   ✅ Status endpoint succeeded!"
    echo "   File Name: $(echo "$STATUS_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 || echo 'Unknown')"
    echo "   Status: $(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' || echo 'Unknown')"
    echo "   Accessible: $(echo "$STATUS_RESPONSE" | grep -o '"accessible":[^,]*' || echo 'Unknown')"
    echo "   Message: $(echo "$STATUS_RESPONSE" | grep -o '"message":"[^"]*"' || echo 'No message')"
    echo "   Recommendation: $(echo "$STATUS_RESPONSE" | grep -o '"recommendation":"[^"]*"' || echo 'No recommendation')"
    echo ""
fi

echo "📁 Full responses saved to:"
echo "   - file_status_response.json"
echo ""
echo "✅ Testing complete!" 