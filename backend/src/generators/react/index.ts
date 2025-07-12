import { IRNode } from '../../figma/parser';

export function generateReact(irNodes: IRNode[]): string {
  if (!irNodes || irNodes.length === 0) {
    return '// No design elements found';
  }

  let code = `import React from 'react';
import './GeneratedComponent.css';

const GeneratedComponent: React.FC = () => {
  return (
`;

  for (const node of irNodes) {
    code += generateReactNode(node, 2);
  }

  code += `  );
};

export default GeneratedComponent;

// CSS styles
const styles = \`
  .figma-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
\`;
`;

  return code;
}

export function generateReactWithComponents(irNodes: IRNode[]): {
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
      const componentCode = generateReactComponent(node, componentName);
      
      if (!componentNames.has(componentName)) {
        components.push({
          name: componentName,
          code: componentCode,
          type: 'tsx'
        });
        componentNames.add(componentName);
      }
    }
  }

  // Generate main component that uses the components
  let mainCode = `import React from 'react';
import './GeneratedComponent.css';

const GeneratedComponent: React.FC = () => {
  return (
    <div className="figma-container">
`;

  for (const node of irNodes) {
    if (node.children && node.children.length > 0) {
      const componentName = generateComponentName(node.name);
      mainCode += `      <${componentName} />\n`;
    } else {
      mainCode += generateReactNode(node, 2);
    }
  }

  mainCode += `    </div>
  );
};

export default GeneratedComponent;

// CSS styles
const styles = \`
  .figma-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
\`;
`;

  return {
    mainCode,
    components
  };
}

function generateReactComponent(node: IRNode, componentName: string): string {
  let code = `import React from 'react';

const ${componentName}: React.FC = () => {
  return (
`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      code += generateReactNode(child, 2);
    }
  }

  code += `  );
};

export default ${componentName};
`;

  return code;
}

function generateComponentName(name: string): string {
  // Convert name to valid React component name
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/^[0-9]/, '') // Remove leading numbers
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/^$/, 'GeneratedComponent'); // Default name if empty
}

function generateReactNode(node: IRNode, indent: number): string {
  const spaces = ' '.repeat(indent * 2);
  let code = '';

  // Determine the React component type
  let componentType = 'div';
  if (node.type === 'TEXT') {
    componentType = 'p';
  } else if (node.type === 'FRAME' || node.type === 'GROUP') {
    componentType = 'div';
  }

  // Start the component
  code += `${spaces}<${componentType}`;

  // Generate style object
  const styles: Record<string, string> = {};

  if (node.width > 0 && node.height > 0) {
    styles.width = `${node.width}px`;
    styles.height = `${node.height}px`;
  }

  if (node.backgroundColor) {
    styles.backgroundColor = node.backgroundColor;
  }

  if (node.borderColor && node.borderWidth) {
    styles.border = `${node.borderWidth}px solid ${node.borderColor}`;
  }

  if (node.borderRadius && node.borderRadius > 0) {
    styles.borderRadius = `${node.borderRadius}px`;
  }

  if (node.textColor && node.type === 'TEXT') {
    styles.color = node.textColor;
  }

  if (node.fontSize && node.type === 'TEXT') {
    styles.fontSize = `${node.fontSize}px`;
  }

  if (node.fontWeight && node.type === 'TEXT') {
    styles.fontWeight = node.fontWeight;
  }

  if (node.padding) {
    styles.padding = `${node.padding.top}px ${node.padding.right}px ${node.padding.bottom}px ${node.padding.left}px`;
  }

  if (node.x !== 0 || node.y !== 0) {
    styles.position = 'absolute';
    styles.left = `${node.x}px`;
    styles.top = `${node.y}px`;
  }

  if (node.layout === 'horizontal') {
    styles.display = 'flex';
    styles.flexDirection = 'row';
  } else if (node.layout === 'vertical') {
    styles.display = 'flex';
    styles.flexDirection = 'column';
  }

  if (node.spacing && node.spacing > 0) {
    styles.gap = `${node.spacing}px`;
  }

  // Add style prop
  if (Object.keys(styles).length > 0) {
    const styleString = JSON.stringify(styles, null, 2)
      .split('\n')
      .map((line, index) => index === 0 ? line : ' '.repeat(indent * 2 + 2) + line)
      .join('\n');
    
    code += `\n${spaces}  style={${styleString}}`;
  }

  // Add children
  if (node.children && node.children.length > 0) {
    code += `\n${spaces}>`;
    for (const child of node.children) {
      code += `\n${generateReactNode(child, indent + 1)}`;
    }
    code += `\n${spaces}</${componentType}>`;
  } else if (node.type === 'TEXT') {
    code += `\n${spaces}>${node.text || 'Sample Text'}</${componentType}>`;
  } else {
    code += `\n${spaces}/>`;
  }

  return code;
}

// Alternative CSS-in-JS approach
export function generateReactWithStyledComponents(irNodes: IRNode[]): string {
  if (!irNodes || irNodes.length === 0) {
    return '// No design elements found';
  }

  let code = `import React from 'react';
import styled from 'styled-components';

`;

  // Generate styled components
  for (let i = 0; i < irNodes.length; i++) {
    const node = irNodes[i];
    code += generateStyledComponent(node, `Component${i}`, 0);
  }

  code += `const GeneratedComponent: React.FC = () => {
  return (
`;

  for (let i = 0; i < irNodes.length; i++) {
    const node = irNodes[i];
    code += generateStyledComponentUsage(node, `Component${i}`, 2);
  }

  code += `  );
};

export default GeneratedComponent;
`;

  return code;
}

function generateStyledComponent(node: IRNode, componentName: string, indent: number): string {
  const spaces = ' '.repeat(indent * 2);
  let code = '';

  // Determine the base component
  let baseComponent = 'div';
  if (node.type === 'TEXT') {
    baseComponent = 'p';
  }

  code += `${spaces}const ${componentName} = styled.${baseComponent}\`
`;

  // Add CSS properties
  if (node.width > 0 && node.height > 0) {
    code += `${spaces}  width: ${node.width}px;\n`;
    code += `${spaces}  height: ${node.height}px;\n`;
  }

  if (node.backgroundColor) {
    code += `${spaces}  background-color: ${node.backgroundColor};\n`;
  }

  if (node.borderColor && node.borderWidth) {
    code += `${spaces}  border: ${node.borderWidth}px solid ${node.borderColor};\n`;
  }

  if (node.borderRadius && node.borderRadius > 0) {
    code += `${spaces}  border-radius: ${node.borderRadius}px;\n`;
  }

  if (node.textColor && node.type === 'TEXT') {
    code += `${spaces}  color: ${node.textColor};\n`;
  }

  if (node.fontSize && node.type === 'TEXT') {
    code += `${spaces}  font-size: ${node.fontSize}px;\n`;
  }

  if (node.fontWeight && node.type === 'TEXT') {
    code += `${spaces}  font-weight: ${node.fontWeight};\n`;
  }

  if (node.padding) {
    code += `${spaces}  padding: ${node.padding.top}px ${node.padding.right}px ${node.padding.bottom}px ${node.padding.left}px;\n`;
  }

  if (node.x !== 0 || node.y !== 0) {
    code += `${spaces}  position: absolute;\n`;
    code += `${spaces}  left: ${node.x}px;\n`;
    code += `${spaces}  top: ${node.y}px;\n`;
  }

  if (node.layout === 'horizontal') {
    code += `${spaces}  display: flex;\n`;
    code += `${spaces}  flex-direction: row;\n`;
  } else if (node.layout === 'vertical') {
    code += `${spaces}  display: flex;\n`;
    code += `${spaces}  flex-direction: column;\n`;
  }

  if (node.spacing && node.spacing > 0) {
    code += `${spaces}  gap: ${node.spacing}px;\n`;
  }

  code += `${spaces}\`;\n\n`;

  return code;
}

function generateStyledComponentUsage(node: IRNode, componentName: string, indent: number): string {
  const spaces = ' '.repeat(indent * 2);
  let code = '';

  code += `${spaces}<${componentName}>`;
  
  if (node.type === 'TEXT') {
    code += `${node.text || 'Sample Text'}`;
  }
  
  if (node.children && node.children.length > 0) {
    code += `\n`;
    for (const child of node.children) {
      code += generateStyledComponentUsage(child, `${componentName}Child`, indent + 1);
    }
    code += `${spaces}`;
  }
  
  code += `</${componentName}>\n`;

  return code;
}
