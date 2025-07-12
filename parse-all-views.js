// Comprehensive Figma Node Parser and Code Generator
// Parses all views in a node and converts to React, SwiftUI, and Jetpack Compose

const fileKey = "QX6UcGsyTxi5UxVJFDX3BJ"; // Replace with your file key
const targetNodeId = "8182:39931"; // Replace with your target node ID
const accessToken = "YOUR_ACCESS_TOKEN_HERE"; // Replace with your actual token
const backendUrl = "https://figma-to-code-backend.onrender.com";

async function parseAllViewsAndGenerateCode() {
  try {
    console.log("🚀 Starting comprehensive view parsing and code generation...");
    console.log(`📄 Target Node: ${targetNodeId}`);
    console.log(`📁 File Key: ${fileKey}`);
    
    // Step 1: Get file data for the specific node
    console.log("\n📊 Step 1: Getting file data for specific node...");
    const figmaData = await getFigmaFileData(fileKey, targetNodeId);
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
        pageId: targetNodeId
      })
    });
    
    if (!parseResponse.ok) {
      throw new Error(`Parse failed: ${parseResponse.status} ${parseResponse.statusText}`);
    }
    
    const parseData = await parseResponse.json();
    console.log(`✅ Parsed ${parseData.nodeCount} nodes in ${parseData.processingTime}ms`);
    
    // Step 3: Generate code for all platforms
    console.log("\n⚛️ Step 3: Generating code for all platforms...");
    
    const platforms = ['react', 'swiftui', 'jetpack'];
    const generatedCode = {};
    
    for (const platform of platforms) {
      console.log(`\n🔄 Generating ${platform.toUpperCase()} code...`);
      
      const generateResponse = await fetch(`${backendUrl}/api/figma/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ir: parseData.ir,
          platform: platform
        })
      });
      
      if (!generateResponse.ok) {
        throw new Error(`${platform} generation failed: ${generateResponse.status} ${generateResponse.statusText}`);
      }
      
      const generateData = await generateResponse.json();
      generatedCode[platform] = generateData;
      
      console.log(`✅ Generated ${platform.toUpperCase()} code in ${generateData.processingTime}ms`);
    }
    
    // Step 4: Display comprehensive results
    console.log("\n🎉 SUCCESS! All code generation complete!");
    console.log("=".repeat(60));
    console.log("📊 COMPREHENSIVE SUMMARY:");
    console.log(`   File Key: ${fileKey}`);
    console.log(`   Target Node: ${targetNodeId}`);
    console.log(`   Nodes Processed: ${parseData.nodeCount}`);
    console.log(`   Parse Time: ${parseData.processingTime}ms`);
    console.log(`   Total Generation Time: ${Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms`);
    console.log(`   Total Time: ${parseData.processingTime + Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms`);
    console.log("=".repeat(60));
    
    // Step 5: Save all generated code to files
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      
      // Create output directory
      const outputDir = 'generated-code';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      // Save each platform's code
      for (const [platform, data] of Object.entries(generatedCode)) {
        const fileExtension = getFileExtension(platform);
        const fileName = `${outputDir}/generated-${platform}.${fileExtension}`;
        fs.writeFileSync(fileName, data.code);
        console.log(`💾 ${platform.toUpperCase()} code saved to '${fileName}'`);
      }
      
      // Save comprehensive report
      const report = generateComprehensiveReport(parseData, generatedCode);
      fs.writeFileSync(`${outputDir}/generation-report.md`, report);
      console.log(`📋 Generation report saved to '${outputDir}/generation-report.md'`);
      
    } else {
      // Browser environment - display code
      console.log("\n📋 Generated Code:");
      console.log("=".repeat(60));
      
      for (const [platform, data] of Object.entries(generatedCode)) {
        console.log(`\n🔸 ${platform.toUpperCase()} CODE:`);
        console.log("-".repeat(40));
        console.log(data.code);
        console.log("-".repeat(40));
      }
    }
    
    return {
      success: true,
      parseData,
      generatedCode,
      summary: {
        nodeCount: parseData.nodeCount,
        parseTime: parseData.processingTime,
        totalGenerationTime: Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0),
        platforms: Object.keys(generatedCode)
      }
    };
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function getFileExtension(platform) {
  switch (platform) {
    case 'swiftui': return 'swift';
    case 'react': return 'tsx';
    case 'jetpack': return 'kt';
    default: return 'txt';
  }
}

function generateComprehensiveReport(parseData, generatedCode) {
  const timestamp = new Date().toISOString();
  
  let report = `# Figma to Code Generation Report

**Generated:** ${timestamp}
**File Key:** ${fileKey}
**Target Node:** ${targetNodeId}

## 📊 Processing Summary

- **Nodes Processed:** ${parseData.nodeCount}
- **Parse Time:** ${parseData.processingTime}ms
- **Total Generation Time:** ${Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms
- **Total Time:** ${parseData.processingTime + Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms

## 🎯 Generated Platforms

`;

  for (const [platform, data] of Object.entries(generatedCode)) {
    report += `### ${platform.toUpperCase()}
- **Generation Time:** ${data.processingTime}ms
- **File Extension:** ${getFileExtension(platform)}
- **Output File:** generated-${platform}.${getFileExtension(platform)}

\`\`\`${getFileExtension(platform)}
${data.code}
\`\`\`

---
`;
  }

  report += `
## 🚀 Next Steps

1. Review the generated code for each platform
2. Customize the code according to your project's needs
3. Add any missing functionality or styling
4. Test the generated components in your development environment

## 📝 Notes

- The generated code is based on the Figma design structure
- Some manual adjustments may be needed for production use
- Consider adding proper error handling and accessibility features
- Test the components across different screen sizes and devices
`;

  return report;
}

// Helper function to get Figma file data
async function getFigmaFileData(fileKey, nodeId) {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Figma file: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseAllViewsAndGenerateCode };
} else if (typeof window !== 'undefined') {
  window.parseAllViewsAndGenerateCode = parseAllViewsAndGenerateCode;
}

// Auto-run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  parseAllViewsAndGenerateCode()
    .then(result => {
      if (result.success) {
        console.log("\n✅ All done! Check the generated files in the 'generated-code' directory.");
      } else {
        console.error("❌ Failed to generate code:", result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("❌ Unexpected error:", error);
      process.exit(1);
    });
}

console.log(`
🔧 USAGE INSTRUCTIONS:

1. Replace the variables at the top of this file:
   - fileKey: Your Figma file key
   - targetNodeId: The specific node ID you want to parse
   - accessToken: Your Figma access token

2. Run the script:
   Node.js: node parse-all-views.js
   Browser: Open console and run parseAllViewsAndGenerateCode()

3. The script will:
   - Parse all views in the specified node
   - Generate code for React, SwiftUI, and Jetpack Compose
   - Save all files to a 'generated-code' directory
   - Create a comprehensive generation report

4. Get your access token from:
   https://figma-to-code-backend.onrender.com/api/figma/oauth/login
`); 