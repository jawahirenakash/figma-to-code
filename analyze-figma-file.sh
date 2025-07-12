#!/bin/bash

# Comprehensive Figma File Analysis
# Usage: ./analyze-figma-file.sh YOUR_ACCESS_TOKEN

if [ -z "$1" ]; then
    echo "🔍 Figma File Analysis Tool"
    echo "=========================="
    echo ""
    echo "File: https://www.figma.com/design/QX6UcGsyTxi5UxVJFDX3BJ/Grizzlies-Design---V2-Updated--5-june-2025-Design-System-Revision--?node-id=8182-39931"
    echo "File Key: QX6UcGsyTxi5UxVJFDX3BJ"
    echo "Node ID: 8182-39931"
    echo ""
    echo "Usage: ./analyze-figma-file.sh YOUR_ACCESS_TOKEN"
    echo ""
    echo "To get your access token:"
    echo "1. Visit: https://figma-to-code-backend.onrender.com/api/figma/oauth/login"
    echo "2. Complete OAuth flow"
    echo "3. Copy the access_token from the URL"
    exit 1
fi

ACCESS_TOKEN="$1"
FILE_KEY="QX6UcGsyTxi5UxVJFDX3BJ"
NODE_ID="8182-39931"
BACKEND_URL="https://figma-to-code-backend.onrender.com"

echo "🔍 Comprehensive Figma File Analysis"
echo "===================================="
echo ""
echo "📄 File Details:"
echo "   URL: https://www.figma.com/design/$FILE_KEY/Grizzlies-Design---V2-Updated--5-june-2025-Design-System-Revision--?node-id=$NODE_ID"
echo "   File Key: $FILE_KEY"
echo "   Target Node: $NODE_ID"
echo "   Backend: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "🏥 Step 1: Backend Health Check..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
echo "   Status: $(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' || echo 'Unknown')"
echo ""

# Test 2: Get Available Pages
echo "📄 Step 2: Analyzing File Structure..."
PAGES_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/pages" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

# Check for errors in pages response
if echo "$PAGES_RESPONSE" | grep -q '"error"'; then
    echo "❌ Error getting pages:"
    echo "$PAGES_RESPONSE" | grep -o '"error":"[^"]*"' || echo "Unknown error"
    echo "$PAGES_RESPONSE" | grep -o '"details":"[^"]*"' || echo ""
    echo ""
    exit 1
fi

# Save pages response
echo "$PAGES_RESPONSE" > analysis_pages.json

# Extract page information
TOTAL_PAGES=$(echo "$PAGES_RESPONSE" | grep -o '"totalPages":[0-9]*' | grep -o '[0-9]*' || echo "0")
echo "   Total Pages: $TOTAL_PAGES"

# List pages
echo "   Available Pages:"
echo "$PAGES_RESPONSE" | grep -o '"name":"[^"]*"' | sed 's/"name":"/     - /' | sed 's/"$//' || echo "     No pages found"
echo ""

# Test 3: Extract All Pages (for size analysis)
echo "📊 Step 3: File Size Analysis..."
ALL_PAGES_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/extract" \
  -H "Content-Type: application/json" \
  -d "{
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"fileKey\": \"$FILE_KEY\"
  }")

# Save full response
echo "$ALL_PAGES_RESPONSE" > analysis_full_extract.json

# Extract metrics
FILE_SIZE=$(echo "$ALL_PAGES_RESPONSE" | grep -o '"fileSize":"[^"]*"' | grep -o '[0-9.]*' || echo "unknown")
NODE_COUNT=$(echo "$ALL_PAGES_RESPONSE" | grep -o '"nodeCount":[0-9]*' | grep -o '[0-9]*' || echo "unknown")
PROCESSING_TIME=$(echo "$ALL_PAGES_RESPONSE" | grep -o '"processingTime":[0-9]*' | grep -o '[0-9]*' || echo "unknown")

echo "   📈 File Metrics:"
echo "      File Size: $FILE_SIZE MB"
echo "      Total Nodes: $NODE_COUNT"
echo "      Processing Time: $PROCESSING_TIME ms"
echo ""

# Test 4: Extract Single Page (for comparison)
if [ "$TOTAL_PAGES" -gt 0 ]; then
    FIRST_PAGE_ID=$(echo "$PAGES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | grep -o '"[^"]*"' | head -1 | sed 's/"//g')
    FIRST_PAGE_NAME=$(echo "$PAGES_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//' | sed 's/"$//')
    
    echo "🎯 Step 4: Single Page Analysis..."
    echo "   Testing with page: $FIRST_PAGE_NAME ($FIRST_PAGE_ID)"
    
    SINGLE_PAGE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/extract" \
      -H "Content-Type: application/json" \
      -d "{
        \"accessToken\": \"$ACCESS_TOKEN\",
        \"fileKey\": \"$FILE_KEY\",
        \"pageId\": \"$FIRST_PAGE_ID\"
      }")
    
    # Save single page response
    echo "$SINGLE_PAGE_RESPONSE" > analysis_single_page.json
    
    # Extract single page metrics
    SINGLE_FILE_SIZE=$(echo "$SINGLE_PAGE_RESPONSE" | grep -o '"fileSize":"[^"]*"' | grep -o '[0-9.]*' || echo "unknown")
    SINGLE_NODE_COUNT=$(echo "$SINGLE_PAGE_RESPONSE" | grep -o '"nodeCount":[0-9]*' | grep -o '[0-9]*' || echo "unknown")
    SINGLE_PROCESSING_TIME=$(echo "$SINGLE_PAGE_RESPONSE" | grep -o '"processingTime":[0-9]*' | grep -o '[0-9]*' || echo "unknown")
    
    echo "   📊 Single Page Metrics:"
    echo "      File Size: $SINGLE_FILE_SIZE MB"
    echo "      Nodes: $SINGLE_NODE_COUNT"
    echo "      Processing Time: $SINGLE_PROCESSING_TIME ms"
    echo ""
    
    # Performance comparison
    echo "⚡ Performance Comparison:"
    if [ "$FILE_SIZE" != "unknown" ] && [ "$SINGLE_FILE_SIZE" != "unknown" ]; then
        SIZE_RATIO=$(echo "scale=1; $SINGLE_FILE_SIZE / $FILE_SIZE * 100" | bc 2>/dev/null || echo "unknown")
        echo "      Size Reduction: $SIZE_RATIO% of full file"
    fi
    if [ "$NODE_COUNT" != "unknown" ] && [ "$SINGLE_NODE_COUNT" != "unknown" ]; then
        NODE_RATIO=$(echo "scale=1; $SINGLE_NODE_COUNT / $NODE_COUNT * 100" | bc 2>/dev/null || echo "unknown")
        echo "      Node Reduction: $NODE_RATIO% of total nodes"
    fi
    if [ "$PROCESSING_TIME" != "unknown" ] && [ "$SINGLE_PROCESSING_TIME" != "unknown" ]; then
        TIME_RATIO=$(echo "scale=1; $SINGLE_PROCESSING_TIME / $PROCESSING_TIME * 100" | bc 2>/dev/null || echo "unknown")
        echo "      Time Reduction: $TIME_RATIO% of full processing time"
    fi
    echo ""
fi

# Test 5: Check for specific node
echo "🎯 Step 5: Target Node Analysis..."
echo "   Looking for node: $NODE_ID"

# Check if node exists in the response
if echo "$ALL_PAGES_RESPONSE" | grep -q "$NODE_ID"; then
    echo "   ✅ Target node found in file!"
    echo "   📍 Node location: $(echo "$ALL_PAGES_RESPONSE" | grep -A 5 -B 5 "$NODE_ID" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//' | sed 's/"$//' || echo 'Unknown page')"
else
    echo "   ⚠️  Target node not found in full file response"
    echo "   💡 This might be because the node is in a different page or the file structure is different"
fi
echo ""

# Final recommendations
echo "💡 Analysis Summary & Recommendations:"
echo "======================================"
echo ""

if [ "$FILE_SIZE" != "unknown" ]; then
    if (( $(echo "$FILE_SIZE > 50" | bc -l 2>/dev/null) )); then
        echo "🚨 LARGE FILE DETECTED:"
        echo "   - File size: $FILE_SIZE MB (exceeds 50MB threshold)"
        echo "   - Recommendation: Use page-specific extraction"
        echo "   - Expected memory usage: High"
        echo ""
    elif (( $(echo "$FILE_SIZE > 20" | bc -l 2>/dev/null) )); then
        echo "⚠️  MEDIUM FILE DETECTED:"
        echo "   - File size: $FILE_SIZE MB"
        echo "   - Recommendation: Page-specific extraction recommended"
        echo "   - Expected memory usage: Moderate"
        echo ""
    else
        echo "✅ SMALL FILE DETECTED:"
        echo "   - File size: $FILE_SIZE MB"
        echo "   - Recommendation: Full file processing should work fine"
        echo "   - Expected memory usage: Low"
        echo ""
    fi
fi

echo "🎯 OPTIMAL PROCESSING STRATEGY:"
echo "   1. Use page-specific extraction for better performance"
echo "   2. Target specific pages rather than entire file"
echo "   3. Monitor memory usage during processing"
echo "   4. Consider breaking large files into smaller components"
echo ""

echo "📁 Analysis files saved:"
echo "   - analysis_pages.json (page structure)"
echo "   - analysis_full_extract.json (full file data)"
echo "   - analysis_single_page.json (single page data)"
echo ""

echo "✅ Analysis complete!" 