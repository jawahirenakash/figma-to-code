export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: any;
  layoutMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
}

export interface IRNode {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  layout?: 'horizontal' | 'vertical' | 'none';
  layoutMode?: string; // Original Figma layout mode
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  spacing?: number;
  children?: IRNode[];
}

export interface FigmaDocument {
  document: FigmaNode;
  components: Record<string, FigmaNode>;
  styles: Record<string, any>;
}

export function parseFigmaToIR(figmaData: FigmaDocument, pageId?: string): IRNode[] {
  const irNodes: IRNode[] = [];
  let nodeCount = 0;
  const MAX_NODES = 1000; // Limit to prevent memory issues
  
  function parseNode(node: FigmaNode, parentX: number = 0, parentY: number = 0): IRNode | null {
    // Memory protection: limit number of nodes processed
    if (nodeCount++ > MAX_NODES) {
      console.warn('Reached maximum node limit, truncating parse');
      return null;
    }
    const irNode: IRNode = {
      id: node.id,
      type: node.type,
      name: node.name,
      x: (node.absoluteBoundingBox?.x || 0) - parentX,
      y: (node.absoluteBoundingBox?.y || 0) - parentY,
      width: node.absoluteBoundingBox?.width || 0,
      height: node.absoluteBoundingBox?.height || 0,
      children: []
    };

    // Parse fills (background color)
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.visible !== false) {
        irNode.backgroundColor = rgbaToHex(fill.color);
      }
    }

    // Parse strokes (border)
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.visible !== false) {
        irNode.borderColor = rgbaToHex(stroke.color);
        irNode.borderWidth = node.strokeWeight || 1;
      }
    }

    // Parse corner radius
    if (node.cornerRadius) {
      irNode.borderRadius = node.cornerRadius;
    }

    // Parse text
    if (node.type === 'TEXT' && node.characters) {
      irNode.text = node.characters;
      if (node.style) {
        irNode.fontSize = node.style.fontSize;
        irNode.fontWeight = node.style.fontWeight;
        if (node.fills && node.fills.length > 0) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID' && fill.visible !== false) {
            irNode.textColor = rgbaToHex(fill.color);
          }
        }
      }
    }

    // Parse layout properties
    if (node.layoutMode) {
      irNode.layout = node.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical';
      irNode.layoutMode = node.layoutMode; // Store original layout mode
      irNode.spacing = node.itemSpacing || 0;
      
      if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
        irNode.padding = {
          top: node.paddingTop || 0,
          right: node.paddingRight || 0,
          bottom: node.paddingBottom || 0,
          left: node.paddingLeft || 0
        };
      }
    }

    // Parse children
    if (node.children) {
      for (const child of node.children) {
        const childIR = parseNode(child, irNode.x, irNode.y);
        if (childIR) {
          irNode.children!.push(childIR);
        }
      }
    }

    return irNode;
  }

  // Parse the document
  if (figmaData.document) {
    if (pageId) {
      // Parse specific page
      const targetPage = figmaData.document.children?.find(page => page.id === pageId);
      if (targetPage) {
        console.log(`Parsing specific page: ${targetPage.name} (${pageId})`);
        const pageNode = parseNode(targetPage);
        if (pageNode) {
          irNodes.push(pageNode);
        }
      } else {
        console.warn(`Page with ID ${pageId} not found`);
        // Fallback to first page
        const firstPage = figmaData.document.children?.[0];
        if (firstPage) {
          console.log(`Falling back to first page: ${firstPage.name}`);
          const pageNode = parseNode(firstPage);
          if (pageNode) {
            irNodes.push(pageNode);
          }
        }
      }
    } else {
      // Parse all pages (original behavior)
      const rootNode = parseNode(figmaData.document);
      if (rootNode) {
        irNodes.push(rootNode);
      }
    }
  }

  return irNodes;
}

function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? Math.round(color.a * 255) : 255;
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
}
