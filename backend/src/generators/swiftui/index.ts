import { IRNode } from '../../figma/parser';

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

function generateSwiftUINode(node: IRNode, indent: number): string {
  const spaces = ' '.repeat(indent);
  let code = '';

  // Determine the SwiftUI view type based on the node type
  let viewType = 'Rectangle';
  if (node.type === 'TEXT') {
    viewType = 'Text';
  } else if (node.type === 'FRAME' || node.type === 'GROUP') {
    viewType = 'VStack';
  } else if (node.children && node.children.length > 0) {
    viewType = 'VStack';
  }

  // Start the view
  if (viewType === 'Text') {
    code += `${spaces}Text("${node.text || 'Sample Text'}")\n`;
  } else if (viewType === 'VStack' || viewType === 'HStack') {
    const stackType = node.layout === 'horizontal' ? 'HStack' : 'VStack';
    code += `${spaces}${stackType} {\n`;
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        code += generateSwiftUINode(child, indent + 2);
      }
    }
    
    code += `${spaces}}\n`;
  } else {
    code += `${spaces}${viewType}()\n`;
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
