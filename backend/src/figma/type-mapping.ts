// Comprehensive Figma Type Mapping System
// Maps Figma element types to Jetpack Compose and SwiftUI components

export interface TypeMapping {
  figmaType: string;
  jetpackCompose: string;
  swiftUI: string;
  description: string;
  layoutDirection?: 'vertical' | 'horizontal' | 'none';
}

export const FIGMA_TYPE_MAPPINGS: TypeMapping[] = [
  // FRAME (vertical) - Column layout
  {
    figmaType: 'FRAME',
    jetpackCompose: 'Column',
    swiftUI: 'VStack',
    description: 'Vertical frame container',
    layoutDirection: 'vertical'
  },
  
  // FRAME (horizontal) - Row layout
  {
    figmaType: 'FRAME_HORIZONTAL',
    jetpackCompose: 'Row',
    swiftUI: 'HStack',
    description: 'Horizontal frame container',
    layoutDirection: 'horizontal'
  },
  
  // RECTANGLE - Box with background
  {
    figmaType: 'RECTANGLE',
    jetpackCompose: 'Box',
    swiftUI: 'Rectangle',
    description: 'Rectangle shape with background color',
    layoutDirection: 'none'
  },
  
  // TEXT - Text component
  {
    figmaType: 'TEXT',
    jetpackCompose: 'Text',
    swiftUI: 'Text',
    description: 'Text element with styling',
    layoutDirection: 'none'
  },
  
  // IMAGE - Image component
  {
    figmaType: 'IMAGE',
    jetpackCompose: 'Image',
    swiftUI: 'Image',
    description: 'Image element',
    layoutDirection: 'none'
  },
  
  // COMPONENT - Custom component
  {
    figmaType: 'COMPONENT',
    jetpackCompose: 'Custom Composable',
    swiftUI: 'Custom View',
    description: 'Custom component instance',
    layoutDirection: 'none'
  },
  
  // GROUP - Container
  {
    figmaType: 'GROUP',
    jetpackCompose: 'Box',
    swiftUI: 'Group',
    description: 'Group container',
    layoutDirection: 'none'
  },
  
  // INSTANCE - Component instance
  {
    figmaType: 'INSTANCE',
    jetpackCompose: 'Custom Composable',
    swiftUI: 'Custom View',
    description: 'Component instance',
    layoutDirection: 'none'
  },
  
  // VECTOR - Shape
  {
    figmaType: 'VECTOR',
    jetpackCompose: 'Canvas',
    swiftUI: 'Path',
    description: 'Vector shape',
    layoutDirection: 'none'
  },
  
  // ELLIPSE - Circle/Oval
  {
    figmaType: 'ELLIPSE',
    jetpackCompose: 'Box',
    swiftUI: 'Circle',
    description: 'Elliptical shape',
    layoutDirection: 'none'
  },
  
  // LINE - Line
  {
    figmaType: 'LINE',
    jetpackCompose: 'Box',
    swiftUI: 'Rectangle',
    description: 'Line element',
    layoutDirection: 'none'
  },
  
  // POLYGON - Polygon
  {
    figmaType: 'POLYGON',
    jetpackCompose: 'Canvas',
    swiftUI: 'Path',
    description: 'Polygon shape',
    layoutDirection: 'none'
  },
  
  // STAR - Star shape
  {
    figmaType: 'STAR',
    jetpackCompose: 'Canvas',
    swiftUI: 'Path',
    description: 'Star shape',
    layoutDirection: 'none'
  }
];

// Helper function to get type mapping by Figma type
export function getTypeMapping(figmaType: string, layoutMode?: string): TypeMapping {
  // Special handling for FRAME with layout mode
  if (figmaType === 'FRAME' && layoutMode === 'HORIZONTAL') {
    return FIGMA_TYPE_MAPPINGS.find(m => m.figmaType === 'FRAME_HORIZONTAL') || FIGMA_TYPE_MAPPINGS[0];
  }
  
  // Find exact match
  const mapping = FIGMA_TYPE_MAPPINGS.find(m => m.figmaType === figmaType);
  if (mapping) {
    return mapping;
  }
  
  // Fallback to FRAME for unknown types
  return FIGMA_TYPE_MAPPINGS[0];
}

// Helper function to get Jetpack Compose component
export function getJetpackComponent(figmaType: string, layoutMode?: string): string {
  const mapping = getTypeMapping(figmaType, layoutMode);
  return mapping.jetpackCompose;
}

// Helper function to get SwiftUI component
export function getSwiftUIComponent(figmaType: string, layoutMode?: string): string {
  const mapping = getTypeMapping(figmaType, layoutMode);
  return mapping.swiftUI;
}

// Helper function to get layout direction
export function getLayoutDirection(figmaType: string, layoutMode?: string): 'vertical' | 'horizontal' | 'none' {
  const mapping = getTypeMapping(figmaType, layoutMode);
  return mapping.layoutDirection || 'none';
}

// Component-specific generation helpers
export const COMPONENT_GENERATORS = {
  jetpack: {
    // Box with background color
    box: (backgroundColor?: string, modifiers: string[] = []) => {
      let code = 'Box(\n    modifier = Modifier';
      if (backgroundColor) {
        modifiers.unshift(`background(Color.fromHex("${backgroundColor}"))`);
      }
      if (modifiers.length > 0) {
        code += `\n        .${modifiers.join('\n        .')}`;
      }
      code += '\n)';
      return code;
    },
    
    // Text with styling
    text: (text: string, color?: string, fontSize?: number, fontWeight?: string) => {
      let code = `Text(\n    text = "${text}"`;
      if (color) code += `,\n    color = Color.fromHex("${color}")`;
      if (fontSize) code += `,\n    fontSize = ${fontSize}.sp`;
      if (fontWeight) code += `,\n    fontWeight = FontWeight.${mapFontWeight(fontWeight)}`;
      code += '\n)';
      return code;
    },
    
    // Column with children
    column: (children: string[], spacing?: number, modifiers: string[] = []) => {
      let code = 'Column(\n';
      if (spacing && spacing > 0) {
        code += `    verticalArrangement = Arrangement.spacedBy(${spacing}.dp),\n`;
      }
      code += '    modifier = Modifier';
      if (modifiers.length > 0) {
        code += `\n        .${modifiers.join('\n        .')}`;
      }
      code += '\n) {\n';
      children.forEach(child => {
        code += `    ${child}\n`;
      });
      code += '}';
      return code;
    },
    
    // Row with children
    row: (children: string[], spacing?: number, modifiers: string[] = []) => {
      let code = 'Row(\n';
      if (spacing && spacing > 0) {
        code += `    horizontalArrangement = Arrangement.spacedBy(${spacing}.dp),\n`;
      }
      code += '    modifier = Modifier';
      if (modifiers.length > 0) {
        code += `\n        .${modifiers.join('\n        .')}`;
      }
      code += '\n) {\n';
      children.forEach(child => {
        code += `    ${child}\n`;
      });
      code += '}';
      return code;
    }
  },
  
  swiftui: {
    // Rectangle with background
    rectangle: (backgroundColor?: string, modifiers: string[] = []) => {
      let code = 'Rectangle()';
      if (backgroundColor) {
        code += `\n    .fill(Color(hex: "${backgroundColor}"))`;
      }
      if (modifiers.length > 0) {
        code += `\n    .${modifiers.join('\n    .')}`;
      }
      return code;
    },
    
    // Text with styling
    text: (text: string, color?: string, fontSize?: number, fontWeight?: string) => {
      let code = `Text("${text}")`;
      if (color) code += `\n    .foregroundColor(Color(hex: "${color}"))`;
      if (fontSize) code += `\n    .font(.system(size: ${fontSize}))`;
      if (fontWeight) code += `\n    .fontWeight(.${mapFontWeight(fontWeight)})`;
      return code;
    },
    
    // VStack with children
    vstack: (children: string[], spacing?: number, modifiers: string[] = []) => {
      let code = 'VStack {';
      if (spacing && spacing > 0) {
        code += `\n    .spacing(${spacing})`;
      }
      children.forEach(child => {
        code += `\n    ${child}`;
      });
      code += '\n}';
      if (modifiers.length > 0) {
        code += `\n    .${modifiers.join('\n    .')}`;
      }
      return code;
    },
    
    // HStack with children
    hstack: (children: string[], spacing?: number, modifiers: string[] = []) => {
      let code = 'HStack {';
      if (spacing && spacing > 0) {
        code += `\n    .spacing(${spacing})`;
      }
      children.forEach(child => {
        code += `\n    ${child}`;
      });
      code += '\n}';
      if (modifiers.length > 0) {
        code += `\n    .${modifiers.join('\n    .')}`;
      }
      return code;
    }
  }
};

// Font weight mapping
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
    '900': 'Black',
    'THIN': 'Thin',
    'EXTRA_LIGHT': 'ExtraLight',
    'LIGHT': 'Light',
    'NORMAL': 'Normal',
    'MEDIUM': 'Medium',
    'SEMI_BOLD': 'SemiBold',
    'BOLD': 'Bold',
    'EXTRA_BOLD': 'ExtraBold',
    'BLACK': 'Black'
  };
  
  return weightMap[weight] || 'Normal';
}

// SwiftUI font weight mapping
function mapSwiftUIFontWeight(weight: string): string {
  const weightMap: Record<string, string> = {
    '100': 'ultraLight',
    '200': 'thin',
    '300': 'light',
    '400': 'regular',
    '500': 'medium',
    '600': 'semibold',
    '700': 'bold',
    '800': 'heavy',
    '900': 'black',
    'THIN': 'thin',
    'EXTRA_LIGHT': 'ultraLight',
    'LIGHT': 'light',
    'NORMAL': 'regular',
    'MEDIUM': 'medium',
    'SEMI_BOLD': 'semibold',
    'BOLD': 'bold',
    'EXTRA_BOLD': 'heavy',
    'BLACK': 'black'
  };
  
  return weightMap[weight] || 'regular';
} 