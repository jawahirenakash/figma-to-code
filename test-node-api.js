// Test script for node API with URL encoding
// This tests the Figma API call that was failing

const fileKey = "QX6UcGsyTxi5UxVJFDX3BJ";
const nodeId = "8182:39931";
const accessToken = "YOUR_ACCESS_TOKEN_HERE"; // Replace with your actual token

async function testNodeAPI() {
  console.log("🧪 Testing Node API with URL Encoding");
  console.log("=====================================");
  console.log(`File Key: ${fileKey}`);
  console.log(`Node ID: ${nodeId}`);
  console.log(`Encoded Node ID: ${encodeURIComponent(nodeId)}`);
  console.log("");

  try {
    // Test the exact API call that was failing
    const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
    console.log(`API URL: ${url}`);
    console.log("");

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ SUCCESS: Node data retrieved");
      console.log(`Node found: ${data.nodes && data.nodes[nodeId] ? 'Yes' : 'No'}`);
      
      if (data.nodes && data.nodes[nodeId]) {
        const node = data.nodes[nodeId];
        console.log(`Node name: ${node.document?.name || 'Unnamed'}`);
        console.log(`Node type: ${node.document?.type || 'Unknown'}`);
        console.log(`Children count: ${node.document?.children?.length || 0}`);
      }
    } else {
      const errorData = await response.text();
      console.log("❌ FAILED: API call failed");
      console.log(`Error response: ${errorData}`);
    }

  } catch (error) {
    console.log("❌ ERROR: Network or other error");
    console.log(`Error: ${error.message}`);
  }
}

// Instructions
console.log("📋 Instructions:");
console.log("1. Replace 'YOUR_ACCESS_TOKEN_HERE' with your actual Figma access token");
console.log("2. Run this script with: node test-node-api.js");
console.log("3. Check if the API call succeeds with URL encoding");
console.log("");

// Uncomment the line below to run the test
// testNodeAPI(); 