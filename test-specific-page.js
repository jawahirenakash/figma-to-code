// Test script to extract and generate code for specific page
// Usage: Run this in browser console or Node.js environment

const fileKey = "QX6UcGsyTxi5UxVJFDX3BJ";
const targetPageId = "8182:39931"; // Light & Dark Mode page
const accessToken = "YOUR_ACCESS_TOKEN_HERE"; // Replace with your actual token
const backendUrl = "https://figma-to-code-backend.onrender.com";

async function extractAndGenerateCode() {
  try {
    console.log("🚀 Starting extraction and code generation...");
    console.log(`📄 Target Page: Light & Dark Mode (${targetPageId})`);
    console.log(`📁 File Key: ${fileKey}`);
    
    // Step 1: Get file data for the specific page
    console.log("\n📊 Step 1: Getting file data for specific page...");
    const figmaData = await getFigmaFileData(fileKey, targetPageId);
    console.log("✅ File data retrieved successfully");
    
    // Step 2: Send to backend for parsing
    console.log("\n🔧 Step 2: Parsing Figma data to IR...");
    const parseResponse = await fetch(`${backendUrl}/api/figma/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        figmaData,
        pageId: targetPageId
      })
    });
    
    if (!parseResponse.ok) {
      throw new Error(`Parse failed: ${parseResponse.status} ${parseResponse.statusText}`);
    }
    
    const parseData = await parseResponse.json();
    console.log(`✅ Parsed ${parseData.nodeCount} nodes in ${parseData.processingTime}ms`);
    
    // Step 3: Generate React code
    console.log("\n⚛️ Step 3: Generating React code...");
    const generateResponse = await fetch(`${backendUrl}/api/figma/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ir: parseData.ir,
        platform: 'react'
      })
    });
    
    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status} ${generateResponse.statusText}`);
    }
    
    const generateData = await generateResponse.json();
    console.log(`✅ Generated React code in ${generateData.processingTime}ms`);
    
    // Step 4: Display results
    console.log("\n🎉 SUCCESS! Code generation complete!");
    console.log("=".repeat(50));
    console.log("📊 SUMMARY:");
    console.log(`   File Size: 213.52 MB`);
    console.log(`   Target Page: Light & Dark Mode`);
    console.log(`   Nodes Processed: ${parseData.nodeCount}`);
    console.log(`   Parse Time: ${parseData.processingTime}ms`);
    console.log(`   Generate Time: ${generateData.processingTime}ms`);
    console.log(`   Total Time: ${parseData.processingTime + generateData.processingTime}ms`);
    console.log("=".repeat(50));
    
    // Save code to file (if in Node.js environment)
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      fs.writeFileSync('light-dark-mode.tsx', generateData.code);
      console.log("💾 Code saved to 'light-dark-mode.tsx'");
    } else {
      console.log("📋 Generated Code:");
      console.log("=".repeat(50));
      console.log(generateData.code);
    }
    
    return {
      success: true,
      parseData,
      generateData,
      code: generateData.code
    };
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getFigmaFileData(fileKey, pageId) {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }
  
  const figmaData = await response.json();
  
  // Filter to specific page if pageId is provided
  if (pageId && figmaData.document?.children) {
    const targetPage = figmaData.document.children.find(page => page.id === pageId);
    if (targetPage) {
      figmaData.document.children = [targetPage];
      console.log(`🎯 Filtered to page: ${targetPage.name}`);
    } else {
      console.warn(`⚠️ Page ${pageId} not found, using all pages`);
    }
  }
  
  return figmaData;
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractAndGenerateCode, getFigmaFileData };
} else if (typeof window !== 'undefined') {
  window.extractAndGenerateCode = extractAndGenerateCode;
  window.getFigmaFileData = getFigmaFileData;
}

console.log("📝 Usage Instructions:");
console.log("1. Replace 'YOUR_ACCESS_TOKEN_HERE' with your actual Figma access token");
console.log("2. Run: extractAndGenerateCode()");
console.log("3. The code will be generated for the Light & Dark Mode page"); 