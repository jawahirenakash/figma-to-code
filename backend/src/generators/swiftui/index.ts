import { IRNode } from '../../figma/parser';
import { getSwiftUIComponent, getLayoutDirection, COMPONENT_GENERATORS } from '../../figma/type-mapping';

export function generateSwiftUI(irNodes: IRNode[]): string {
  if (!irNodes || irNodes.length === 0) {
    return '// No design elements found';
  }

  let code = `import SwiftUI

struct GeneratedView: View {
    var body: some View {
`;

  for (const node of irNodes) {
    code += generateSwiftUINode(node, 2);
  }

  code += `    }
}

#Preview {
    GeneratedView()
}
`;

  return code;
}

export function generateSwiftUIWithComponents(irNodes: IRNode[]): {
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
      const componentCode = generateSwiftUIComponent(node, componentName);
      
      if (!componentNames.has(componentName)) {
        components.push({
          name: componentName,
          code: componentCode,
          type: 'swift'
        });
        componentNames.add(componentName);
      }
    }
  }

  // Generate main view that uses the components
  let mainCode = `import SwiftUI

struct GeneratedView: View {
    var body: some View {
        VStack {
`;

  for (const node of irNodes) {
    if (node.children && node.children.length > 0) {
      const componentName = generateComponentName(node.name);
      mainCode += `            ${componentName}()\n`;
    } else {
      mainCode += generateSwiftUINode(node, 3);
    }
  }

  mainCode += `        }
    }
}

#Preview {
    GeneratedView()
}
`;

  return {
    mainCode,
    components
  };
}

function generateSwiftUIComponent(node: IRNode, componentName: string): string {
  let code = `import SwiftUI

struct ${componentName}: View {
    var body: some View {
`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      code += generateSwiftUINode(child, 2);
    }
  }

  code += `    }
}

#Preview {
    ${componentName}()
}
`;

  return code;
}

function generateComponentName(name: string): string {
  // Convert name to valid Swift struct name
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/^[0-9]/, '') // Remove leading numbers
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/^$/, 'GeneratedComponent'); // Default name if empty
}

function generateSwiftUINode(node: IRNode, indent: number): string {
  const spaces = ' '.repeat(indent);
  let code = '';

  // Get the appropriate SwiftUI component based on Figma type and layout
  const componentType = getSwiftUIComponent(node.type, node.layout);
  const layoutDirection = getLayoutDirection(node.type, node.layout);

  // Start the view based on type mapping
  if (componentType === 'Text') {
    code += `${spaces}Text("${node.text || 'Sample Text'}")\n`;
  } else if (componentType === 'VStack' || componentType === 'HStack') {
    const stackType = layoutDirection === 'horizontal' ? 'HStack' : 'VStack';
    code += `${spaces}${stackType} {\n`;
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        code += generateSwiftUINode(child, indent + 2);
      }
    }
    
    code += `${spaces}}\n`;
  } else if (componentType === 'Rectangle') {
    code += `${spaces}Rectangle()\n`;
  } else if (componentType === 'Circle') {
    code += `${spaces}Circle()\n`;
  } else if (componentType === 'Image') {
    code += `${spaces}Image("${node.name || 'placeholder'}")\n`;
  } else if (componentType === 'Custom View') {
    code += `${spaces}${node.name || 'CustomView'}()\n`;
  } else if (componentType === 'Group') {
    code += `${spaces}Group {\n`;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        code += generateSwiftUINode(child, indent + 2);
      }
    }
    code += `${spaces}}\n`;
  } else {
    code += `${spaces}Rectangle()\n`;
  }

  // Add modifiers
  if (node.width > 0 && node.height > 0) {
    code += `${spaces}    .frame(width: ${node.width}, height: ${node.height})\n`;
  }

  if (node.backgroundColor) {
    code += `${spaces}    .background(Color(hex: "${node.backgroundColor}"))\n`;
  }

  if (node.borderColor && node.borderWidth) {
    code += `${spaces}    .overlay(\n`;
    code += `${spaces}        RoundedRectangle(cornerRadius: ${node.borderRadius || 0})\n`;
    code += `${spaces}            .stroke(Color(hex: "${node.borderColor}"), lineWidth: ${node.borderWidth})\n`;
    code += `${spaces}    )\n`;
  } else if (node.borderRadius && node.borderRadius > 0) {
    code += `${spaces}    .cornerRadius(${node.borderRadius})\n`;
  }

  if (node.textColor && node.type === 'TEXT') {
    code += `${spaces}    .foregroundColor(Color(hex: "${node.textColor}"))\n`;
  }

  if (node.fontSize && node.type === 'TEXT') {
    code += `${spaces}    .font(.system(size: ${node.fontSize}))\n`;
  }

  if (node.fontWeight && node.type === 'TEXT') {
    const weight = mapFontWeight(node.fontWeight);
    code += `${spaces}    .fontWeight(.${weight})\n`;
  }

  if (node.padding) {
    code += `${spaces}    .padding(.top, ${node.padding.top})\n`;
    code += `${spaces}    .padding(.trailing, ${node.padding.right})\n`;
    code += `${spaces}    .padding(.bottom, ${node.padding.bottom})\n`;
    code += `${spaces}    .padding(.leading, ${node.padding.left})\n`;
  }

  if (node.spacing && node.spacing > 0) {
    code += `${spaces}    .spacing(${node.spacing})\n`;
  }

  if (node.x !== 0 || node.y !== 0) {
    code += `${spaces}    .offset(x: ${node.x}, y: ${node.y})\n`;
  }

  return code;
}

function mapFontWeight(weight: string): string {
  const weightMap: Record<string, string> = {
    '100': 'ultraLight',
    '200': 'thin',
    '300': 'light',
    '400': 'regular',
    '500': 'medium',
    '600': 'semibold',
    '700': 'bold',
    '800': 'heavy',
    '900': 'black'
  };
  
  return weightMap[weight] || 'regular';
}

// Extension for hex color support
const hexColorExtension = `

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
`;

export function generateSwiftUIWithExtensions(irNodes: IRNode[]): string {
  return generateSwiftUI(irNodes) + hexColorExtension;
}
