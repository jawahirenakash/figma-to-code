#!/bin/bash

# Test script to parse all views in a Figma node and generate code
# Usage: ./test-parse-views.sh YOUR_ACCESS_TOKEN

echo "🔍 Test Parse All Views in Node"
echo "================================"

if [ $# -eq 0 ]; then
    echo "Usage: $0 YOUR_ACCESS_TOKEN"
    echo ""
    echo "To get your access token:"
    echo "1. Visit: https://figma-to-code-backend.onrender.com/api/figma/oauth/login"
    echo "2. Complete OAuth flow"
    echo "3. Copy the access_token from the URL"
    exit 1
fi

ACCESS_TOKEN="$1"
FILE_KEY="QX6UcGsyTxi5UxVJFDX3BJ"
TARGET_NODE_ID="8182:39931"
BACKEND_URL="https://figma-to-code-backend.onrender.com"

echo "File: https://www.figma.com/design/QX6UcGsyTxi5UxVJFDX3BJ/Grizzlies-Design---V2-Updated--5-june-2025-Design-System-Revision--?node-id=8182-39931"
echo "File Key: $FILE_KEY"
echo "Target Node: ⚪️⚫️ Light & Dark Mode ($TARGET_NODE_ID)"
echo ""

# Test 1: Health check
echo "✅ Step 1: Backend Health Check"
curl -s "$BACKEND_URL/health" | jq .
echo ""

# Test 2: Get Figma file data
echo "✅ Step 2: Getting Figma File Data"
FIGMA_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://api.figma.com/v1/files/$FILE_KEY")

if echo "$FIGMA_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "❌ Failed to get Figma file data:"
    echo "$FIGMA_RESPONSE" | jq .
    exit 1
fi

echo "✅ Figma file data retrieved successfully"
FILE_SIZE=$(echo "$FIGMA_RESPONSE" | jq -r '.document.children | length')
echo "📊 File has $FILE_SIZE root children"
echo ""

# Test 3: Parse to IR
echo "✅ Step 3: Parsing to IR (Intermediate Representation)"
PARSE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/parse" \
  -H "Content-Type: application/json" \
  -d "{
    \"figmaData\": $FIGMA_RESPONSE,
    \"pageId\": \"$TARGET_NODE_ID\"
  }")

if echo "$PARSE_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "❌ Parse failed:"
    echo "$PARSE_RESPONSE" | jq .
    exit 1
fi

NODE_COUNT=$(echo "$PARSE_RESPONSE" | jq -r '.nodeCount')
PROCESSING_TIME=$(echo "$PARSE_RESPONSE" | jq -r '.processingTime')
echo "✅ Parsed $NODE_COUNT nodes in ${PROCESSING_TIME}ms"
echo ""

# Test 4: Generate React code
echo "✅ Step 4: Generating React Code"
REACT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"ir\": $(echo "$PARSE_RESPONSE" | jq -c '.ir'),
    \"platform\": \"react\"
  }")

if echo "$REACT_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "❌ React generation failed:"
    echo "$REACT_RESPONSE" | jq .
    exit 1
fi

REACT_TIME=$(echo "$REACT_RESPONSE" | jq -r '.processingTime')
echo "✅ Generated React code in ${REACT_TIME}ms"
echo ""

# Test 5: Generate SwiftUI code
echo "✅ Step 5: Generating SwiftUI Code"
SWIFTUI_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"ir\": $(echo "$PARSE_RESPONSE" | jq -c '.ir'),
    \"platform\": \"swiftui\"
  }")

if echo "$SWIFTUI_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "❌ SwiftUI generation failed:"
    echo "$SWIFTUI_RESPONSE" | jq .
    exit 1
fi

SWIFTUI_TIME=$(echo "$SWIFTUI_RESPONSE" | jq -r '.processingTime')
echo "✅ Generated SwiftUI code in ${SWIFTUI_TIME}ms"
echo ""

# Test 6: Generate Jetpack Compose code
echo "✅ Step 6: Generating Jetpack Compose Code"
JETPACK_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/figma/generate" \
  -H "Content-Type: application/json" \
  -d "{
    \"ir\": $(echo "$PARSE_RESPONSE" | jq -c '.ir'),
    \"platform\": \"jetpack\"
  }")

if echo "$JETPACK_RESPONSE" | jq -e '.error' > /dev/null; then
    echo "❌ Jetpack generation failed:"
    echo "$JETPACK_RESPONSE" | jq .
    exit 1
fi

JETPACK_TIME=$(echo "$JETPACK_RESPONSE" | jq -r '.processingTime')
echo "✅ Generated Jetpack Compose code in ${JETPACK_TIME}ms"
echo ""

# Summary
TOTAL_TIME=$((PROCESSING_TIME + REACT_TIME + SWIFTUI_TIME + JETPACK_TIME))
echo "🎉 SUCCESS! All parsing and code generation complete!"
echo "=================================================="
echo "📊 SUMMARY:"
echo "   File Key: $FILE_KEY"
echo "   Target Node: $TARGET_NODE_ID"
echo "   Nodes Processed: $NODE_COUNT"
echo "   Parse Time: ${PROCESSING_TIME}ms"
echo "   React Generation: ${REACT_TIME}ms"
echo "   SwiftUI Generation: ${SWIFTUI_TIME}ms"
echo "   Jetpack Generation: ${JETPACK_TIME}ms"
echo "   Total Time: ${TOTAL_TIME}ms"
echo "=================================================="
echo ""

# Save generated code to files
echo "💾 Saving generated code to files..."
mkdir -p generated-code

echo "$REACT_RESPONSE" | jq -r '.code' > generated-code/generated-react.tsx
echo "$SWIFTUI_RESPONSE" | jq -r '.code' > generated-code/generated-swiftui.swift
echo "$JETPACK_RESPONSE" | jq -r '.code' > generated-code/generated-jetpack.kt

echo "✅ React code saved to: generated-code/generated-react.tsx"
echo "✅ SwiftUI code saved to: generated-code/generated-swiftui.swift"
echo "✅ Jetpack code saved to: generated-code/generated-jetpack.kt"
echo ""

# Show sample of generated code
echo "📋 Sample of generated React code:"
echo "----------------------------------------"
head -20 generated-code/generated-react.tsx
echo "..."
echo ""

echo "📋 Sample of generated SwiftUI code:"
echo "----------------------------------------"
head -20 generated-code/generated-swiftui.swift
echo "..."
echo ""

echo "📋 Sample of generated Jetpack code:"
echo "----------------------------------------"
head -20 generated-code/generated-jetpack.kt
echo "..."
echo ""

echo "✅ All done! Check the 'generated-code' directory for the complete files." 