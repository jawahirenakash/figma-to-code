// Test script with mock Figma data to demonstrate parsing and code generation
// This shows the full pipeline without needing OAuth

const backendUrl = "https://figma-to-code-backend.onrender.com";

// Mock Figma data representing a complex UI with multiple views
const mockFigmaData = {
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "children": [
      {
        "id": "1:0",
        "name": "Light & Dark Mode",
        "type": "CANVAS",
        "children": [
          {
            "id": "1:1",
            "name": "Header",
            "type": "FRAME",
            "absoluteBoundingBox": {
              "x": 0,
              "y": 0,
              "width": 375,
              "height": 80
            },
            "fills": [
              {
                "type": "SOLID",
                "color": {"r": 0.95, "g": 0.95, "b": 0.95},
                "visible": true
              }
            ],
            "children": [
              {
                "id": "1:2",
                "name": "Title",
                "type": "TEXT",
                "absoluteBoundingBox": {
                  "x": 20,
                  "y": 20,
                  "width": 200,
                  "height": 40
                },
                "characters": "Design System",
                "fills": [
                  {
                    "type": "SOLID",
                    "color": {"r": 0.1, "g": 0.1, "b": 0.1},
                    "visible": true
                  }
                ],
                "style": {
                  "fontSize": 24,
                  "fontWeight": "BOLD"
                }
              }
            ]
          },
          {
            "id": "1:3",
            "name": "Content",
            "type": "FRAME",
            "absoluteBoundingBox": {
              "x": 0,
              "y": 80,
              "width": 375,
              "height": 600
            },
            "layoutMode": "VERTICAL",
            "paddingLeft": 20,
            "paddingRight": 20,
            "paddingTop": 20,
            "paddingBottom": 20,
            "itemSpacing": 16,
            "children": [
              {
                "id": "1:4",
                "name": "Card",
                "type": "FRAME",
                "absoluteBoundingBox": {
                  "x": 20,
                  "y": 100,
                  "width": 335,
                  "height": 120
                },
                "fills": [
                  {
                    "type": "SOLID",
                    "color": {"r": 1, "g": 1, "b": 1},
                    "visible": true
                  }
                ],
                "strokes": [
                  {
                    "type": "SOLID",
                    "color": {"r": 0.9, "g": 0.9, "b": 0.9},
                    "visible": true
                  }
                ],
                "strokeWeight": 1,
                "cornerRadius": 8,
                "children": [
                  {
                    "id": "1:5",
                    "name": "Card Title",
                    "type": "TEXT",
                    "absoluteBoundingBox": {
                      "x": 40,
                      "y": 120,
                      "width": 150,
                      "height": 24
                    },
                    "characters": "Component Card",
                    "fills": [
                      {
                        "type": "SOLID",
                        "color": {"r": 0.2, "g": 0.2, "b": 0.2},
                        "visible": true
                      }
                    ],
                    "style": {
                      "fontSize": 18,
                      "fontWeight": "SEMI_BOLD"
                    }
                  },
                  {
                    "id": "1:6",
                    "name": "Card Description",
                    "type": "TEXT",
                    "absoluteBoundingBox": {
                      "x": 40,
                      "y": 150,
                      "width": 295,
                      "height": 40
                    },
                    "characters": "This is a sample component card with some description text.",
                    "fills": [
                      {
                        "type": "SOLID",
                        "color": {"r": 0.5, "g": 0.5, "b": 0.5},
                        "visible": true
                      }
                    ],
                    "style": {
                      "fontSize": 14,
                      "fontWeight": "REGULAR"
                    }
                  }
                ]
              },
              {
                "id": "1:7",
                "name": "Button",
                "type": "FRAME",
                "absoluteBoundingBox": {
                  "x": 20,
                  "y": 256,
                  "width": 335,
                  "height": 48
                },
                "fills": [
                  {
                    "type": "SOLID",
                    "color": {"r": 0.2, "g": 0.6, "b": 1},
                    "visible": true
                  }
                ],
                "cornerRadius": 6,
                "children": [
                  {
                    "id": "1:8",
                    "name": "Button Text",
                    "type": "TEXT",
                    "absoluteBoundingBox": {
                      "x": 175,
                      "y": 268,
                      "width": 60,
                      "height": 24
                    },
                    "characters": "Click Me",
                    "fills": [
                      {
                        "type": "SOLID",
                        "color": {"r": 1, "g": 1, "b": 1},
                        "visible": true
                      }
                    ],
                    "style": {
                      "fontSize": 16,
                      "fontWeight": "MEDIUM"
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

async function testMockParsing() {
  try {
    console.log("🧪 Testing Mock Figma Data Parsing and Code Generation");
    console.log("=".repeat(60));
    
    // Step 1: Parse mock data
    console.log("📊 Step 1: Parsing mock Figma data...");
    const parseResponse = await fetch(`${backendUrl}/api/figma/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        figmaData: mockFigmaData,
        pageId: "1:0"
      })
    });
    
    if (!parseResponse.ok) {
      throw new Error(`Parse failed: ${parseResponse.status} ${parseResponse.statusText}`);
    }
    
    const parseData = await parseResponse.json();
    console.log(`✅ Parsed ${parseData.nodeCount} nodes in ${parseData.processingTime}ms`);
    
    // Step 2: Generate code for all platforms
    console.log("\n⚛️ Step 2: Generating code for all platforms...");
    
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
    
    // Step 3: Display results
    console.log("\n🎉 SUCCESS! Mock parsing and code generation complete!");
    console.log("=".repeat(60));
    console.log("📊 SUMMARY:");
    console.log(`   Mock Nodes Processed: ${parseData.nodeCount}`);
    console.log(`   Parse Time: ${parseData.processingTime}ms`);
    console.log(`   Total Generation Time: ${Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms`);
    console.log(`   Total Time: ${parseData.processingTime + Object.values(generatedCode).reduce((sum, data) => sum + data.processingTime, 0)}ms`);
    console.log("=".repeat(60));
    
    // Step 4: Save generated code
    if (typeof require !== 'undefined') {
      const fs = require('fs');
      
      const outputDir = 'mock-generated-code';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      
      for (const [platform, data] of Object.entries(generatedCode)) {
        const fileExtension = getFileExtension(platform);
        const fileName = `${outputDir}/mock-${platform}.${fileExtension}`;
        fs.writeFileSync(fileName, data.code);
        console.log(`💾 ${platform.toUpperCase()} code saved to '${fileName}'`);
      }
    }
    
    // Step 5: Show sample code
    console.log("\n📋 Sample Generated Code:");
    console.log("=".repeat(60));
    
    for (const [platform, data] of Object.entries(generatedCode)) {
      console.log(`\n🔸 ${platform.toUpperCase()} CODE:`);
      console.log("-".repeat(40));
      console.log(data.code);
      console.log("-".repeat(40));
    }
    
    return {
      success: true,
      parseData,
      generatedCode
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

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testMockParsing };
} else if (typeof window !== 'undefined') {
  window.testMockParsing = testMockParsing;
}

// Auto-run if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  testMockParsing()
    .then(result => {
      if (result.success) {
        console.log("\n✅ Mock test complete! Check the 'mock-generated-code' directory.");
      } else {
        console.error("❌ Mock test failed:", result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("❌ Unexpected error:", error);
      process.exit(1);
    });
}

console.log(`
🧪 MOCK TEST INSTRUCTIONS:

This script tests the parsing and code generation pipeline with mock Figma data.

Run the script:
Node.js: node test-mock-parsing.js
Browser: Open console and run testMockParsing()

The mock data includes:
- Header with title
- Content area with card and button
- Proper styling and layout
- Text elements with different styles

This demonstrates the full pipeline without needing OAuth!
`); 