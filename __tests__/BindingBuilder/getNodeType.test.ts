import { describe, it, expect } from 'vitest';
import { getNodeType } from '../../src/BindingBuilder/getNodeType.js';

// DOM環境をモック
const createMockNode = (constructor: string, nodeType?: number, textContent?: string) => {
  const node = {
    constructor: { name: constructor },
    nodeType: nodeType,
    textContent: textContent
  };
  
  // instanceof チェック用のモック
  if (constructor === 'HTMLElement' || constructor.startsWith('HTML')) {
    Object.setPrototypeOf(node, HTMLElement.prototype);
  } else if (constructor === 'SVGElement' || constructor.startsWith('SVG')) {
    Object.setPrototypeOf(node, SVGElement.prototype);
  } else if (constructor === 'Comment') {
    Object.setPrototypeOf(node, Comment.prototype);
  }
  
  return node as unknown as Node;
};

describe('BindingBuilder', () => {
  describe('getNodeType', () => {
    it('should return HTMLElement for HTML elements', () => {
      const node = createMockNode('HTMLDivElement', Node.ELEMENT_NODE);
      const result = getNodeType(node);
      expect(result).toBe('HTMLElement');
    });

    it('should return SVGElement for SVG elements', () => {
      const node = createMockNode('SVGSVGElement', Node.ELEMENT_NODE);
      const result = getNodeType(node);
      expect(result).toBe('SVGElement');
    });

    it('should return Text for comment node with ":" as 3rd character', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@:variable');
      const result = getNodeType(node);
      expect(result).toBe('Text');
    });

    it('should return Template for comment node with "|" as 3rd character', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@|template');
      const result = getNodeType(node);
      expect(result).toBe('Template');
    });

    it('should throw error for unknown node types', () => {
      const node = createMockNode('UnknownNode', 999);
      expect(() => getNodeType(node)).toThrow('Unknown NodeType');
    });

    it('should handle comment nodes without proper format', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, 'regular comment');
      expect(() => getNodeType(node)).toThrow('Unknown NodeType');
    });

    it('should handle comment nodes with null textContent', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, undefined);
      expect(() => getNodeType(node)).toThrow('Unknown NodeType');
    });

    it('should cache results with same node key', () => {
      const node1 = createMockNode('HTMLDivElement', Node.ELEMENT_NODE);
      const node2 = createMockNode('HTMLDivElement', Node.ELEMENT_NODE);
      
      const result1 = getNodeType(node1);
      const result2 = getNodeType(node2);
      
      expect(result1).toBe('HTMLElement');
      expect(result2).toBe('HTMLElement');
    });

    it('should handle custom node key parameter', () => {
      const node = createMockNode('HTMLDivElement', Node.ELEMENT_NODE);
      const customKey = 'CustomKey\t';
      
      const result = getNodeType(node, customKey);
      expect(result).toBe('HTMLElement');
    });

    it('should distinguish between different comment types', () => {
      const textNode = createMockNode('Comment', Node.COMMENT_NODE, '@@:text');
      const templateNode = createMockNode('Comment', Node.COMMENT_NODE, '@@|template');
      
      expect(getNodeType(textNode)).toBe('Text');
      expect(getNodeType(templateNode)).toBe('Template');
    });
  });
});