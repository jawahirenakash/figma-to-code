import { IRNode } from '../../figma/parser';
import { getJetpackComponent, getLayoutDirection, COMPONENT_GENERATORS } from '../../figma/type-mapping';

export function generateJetpack(irNodes: IRNode[]): string {
  if (!irNodes || irNodes.length === 0) {
    return '// No design elements found';
  }

  let code = `import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun GeneratedScreen() {
`;

  for (const node of irNodes) {
    code += generateJetpackNode(node, 1);
  }

  code += `}

// Extension function for hex color support
fun Color.Companion.fromHex(hex: String): Color {
    val hexColor = hex.removePrefix("#")
    val color = android.graphics.Color.parseColor("#$hexColor")
    return Color(color)
}
`;

  return code;
}

export function generateJetpackWithComponents(irNodes: IRNode[]): {
  mainCode: string;
  components: Array<{ name: string; code: string; type: string }>;
} {
  if (!irNodes || irNodes.length === 0) {
    return {
      mainCode: '// No design elements found',
      components: []
    };
  }

  const components: Array<{ name: string; code: string; type: string }> = [];
  const componentNames = new Set<string>();

  // Generate component files for each top-level node
  for (const node of irNodes) {
    if (node.children && node.children.length > 0) {
      const componentName = generateComponentName(node.name);
      const componentCode = generateJetpackComponent(node, componentName);
      
      if (!componentNames.has(componentName)) {
        components.push({
          name: componentName,
          code: componentCode,
          type: 'kt'
        });
        componentNames.add(componentName);
      }
    }
  }

  // Generate main screen that uses the components
  let mainCode = `import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

@Composable
fun GeneratedScreen() {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
`;

  for (const node of irNodes) {
    if (node.children && node.children.length > 0) {
      const componentName = generateComponentName(node.name);
      mainCode += `        ${componentName}()\n`;
    } else {
      mainCode += generateJetpackNode(node, 2);
    }
  }

  mainCode += `    }
}

// Extension function for hex color support
fun Color.Companion.fromHex(hex: String): Color {
    val hexColor = hex.removePrefix("#")
    val color = android.graphics.Color.parseColor("#$hexColor")
    return Color(color)
}
`;

  return {
    mainCode,
    components
  };
}

function generateJetpackComponent(node: IRNode, componentName: string): string {
  let code = `import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ${componentName}() {
`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      code += generateJetpackNode(child, 1);
    }
  }

  code += `}
`;

  return code;
}

function generateComponentName(name: string): string {
  // Convert name to valid Kotlin function name
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/^[0-9]/, '') // Remove leading numbers
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/^$/, 'GeneratedComponent'); // Default name if empty
}

function generateJetpackNode(node: IRNode, indent: number): string {
  const spaces = ' '.repeat(indent * 4);
  let code = '';

  // Get the appropriate Jetpack Compose component based on Figma type and layout
  const componentType = getJetpackComponent(node.type, node.layout);
  const layoutDirection = getLayoutDirection(node.type, node.layout);

  // Start the component based on type mapping
  if (componentType === 'Text') {
    code += `${spaces}Text(\n`;
    code += `${spaces}    text = "${node.text || 'Sample Text'}",\n`;
  } else if (componentType === 'Column' || componentType === 'Row') {
    const containerType = layoutDirection === 'horizontal' ? 'Row' : 'Column';
    code += `${spaces}${containerType}(\n`;
    
    if (node.spacing && node.spacing > 0) {
      const arrangementType = layoutDirection === 'horizontal' ? 'horizontalArrangement' : 'verticalArrangement';
      code += `${spaces}    ${arrangementType} = Arrangement.spacedBy(${node.spacing}.dp),\n`;
    }
    
    code += `${spaces}    modifier = Modifier`;
  } else if (componentType === 'Box') {
    code += `${spaces}Box(\n`;
    code += `${spaces}    modifier = Modifier`;
  } else if (componentType === 'Image') {
    code += `${spaces}Image(\n`;
    code += `${spaces}    painter = painterResource(id = R.drawable.placeholder),\n`;
    code += `${spaces}    contentDescription = "${node.name || 'Image'}",\n`;
    code += `${spaces}    modifier = Modifier`;
  } else if (componentType === 'Custom Composable') {
    code += `${spaces}${node.name || 'CustomComponent'}(\n`;
    code += `${spaces}    modifier = Modifier`;
  } else {
    code += `${spaces}Box(\n`;
    code += `${spaces}    modifier = Modifier`;
  }

  // Add modifiers
  const modifiers: string[] = [];

  if (node.width > 0 && node.height > 0) {
    modifiers.push(`width(${node.width}.dp)`, `height(${node.height}.dp)`);
  }

  if (node.backgroundColor) {
    modifiers.push(`background(Color.fromHex("${node.backgroundColor}"))`);
  }

  if (node.borderColor && node.borderWidth) {
    modifiers.push(`border(${node.borderWidth}.dp, Color.fromHex("${node.borderColor}"))`);
  }

  if (node.borderRadius && node.borderRadius > 0) {
    modifiers.push(`clip(RoundedCornerShape(${node.borderRadius}.dp))`);
  }

  if (node.padding) {
    modifiers.push(`padding(${node.padding.top}.dp, ${node.padding.right}.dp, ${node.padding.bottom}.dp, ${node.padding.left}.dp)`);
  }

  if (node.x !== 0 || node.y !== 0) {
    modifiers.push(`offset(x = ${node.x}.dp, y = ${node.y}.dp)`);
  }

  // Add modifiers to code
  if (modifiers.length > 0) {
    code += `\n${spaces}        .${modifiers.join('\n' + spaces + '        .')}`;
  }

  // Close the modifier
  if (componentType !== 'Text') {
    code += '\n';
  }

  // Add text-specific modifiers
  if (componentType === 'Text') {
    if (node.textColor) {
      code += `${spaces}    color = Color.fromHex("${node.textColor}"),\n`;
    }
    if (node.fontSize) {
      code += `${spaces}    fontSize = ${node.fontSize}.sp,\n`;
    }
    if (node.fontWeight) {
      const weight = mapFontWeight(node.fontWeight);
      code += `${spaces}    fontWeight = FontWeight.${weight},\n`;
    }
  }

  // Add children
  if (node.children && node.children.length > 0) {
    if (componentType === 'Text') {
      code += `${spaces})\n`;
    } else {
      code += `${spaces}) {\n`;
      for (const child of node.children) {
        code += generateJetpackNode(child, indent + 1);
      }
      code += `${spaces}}\n`;
    }
  } else {
    if (componentType === 'Text') {
      code += `${spaces})\n`;
    } else {
      code += `${spaces}\n`;
    }
  }

  return code;
}

function mapFontWeight(weight: string): string {
  const weightMap: Record<string, string> = {
    '100': 'Thin',
    '200': 'ExtraLight',
    '300': 'Light',
    '400': 'Normal',
    '500': 'Medium',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black'
  };
  
  return weightMap[weight] || 'Normal';
}
