import { IRNode } from '../../figma/parser';

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

function generateJetpackNode(node: IRNode, indent: number): string {
  const spaces = ' '.repeat(indent * 4);
  let code = '';

  // Determine the Compose component type
  let componentType = 'Box';
  if (node.type === 'TEXT') {
    componentType = 'Text';
  } else if (node.type === 'FRAME' || node.type === 'GROUP') {
    componentType = 'Column';
  } else if (node.children && node.children.length > 0) {
    componentType = 'Column';
  }

  // Start the component
  if (componentType === 'Text') {
    code += `${spaces}Text(\n`;
    code += `${spaces}    text = "${node.text || 'Sample Text'}",\n`;
  } else if (componentType === 'Column' || componentType === 'Row') {
    const containerType = node.layout === 'horizontal' ? 'Row' : 'Column';
    code += `${spaces}${containerType}(\n`;
    
    if (node.spacing && node.spacing > 0) {
      code += `${spaces}    horizontalArrangement = Arrangement.spacedBy(${node.spacing}.dp),\n`;
    }
    
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
