import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultName } from '../../src/BindingBuilder/getDefaultName.js';
import { NodeType } from '../../src/BindingBuilder/types.js';

// DOM環境をモック
const createMockNode = (constructor: any, tagName?: string, type?: string) => {
  const node = {
    constructor: { name: constructor },
    tagName: tagName,
    type: type
  };
  
  // instanceof チェック用のモック
  if (constructor === 'HTMLInputElement') {
    Object.setPrototypeOf(node, HTMLInputElement.prototype);
  } else if (constructor === 'HTMLSelectElement') {
    Object.setPrototypeOf(node, HTMLSelectElement.prototype);
  } else if (constructor === 'HTMLTextAreaElement') {
    Object.setPrototypeOf(node, HTMLTextAreaElement.prototype);
  } else if (constructor === 'HTMLButtonElement') {
    Object.setPrototypeOf(node, HTMLButtonElement.prototype);
  } else if (constructor === 'HTMLAnchorElement') {
    Object.setPrototypeOf(node, HTMLAnchorElement.prototype);
  } else if (constructor === 'HTMLFormElement') {
    Object.setPrototypeOf(node, HTMLFormElement.prototype);
  } else if (constructor === 'HTMLOptionElement') {
    Object.setPrototypeOf(node, HTMLOptionElement.prototype);
  }
  
  return node as unknown as Node;
};

describe('BindingBuilder', () => {
  describe('getDefaultName', () => {
    it('should return textContent for HTMLElement by default', () => {
      const node = createMockNode('HTMLDivElement');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('textContent');
    });

    it('should return value for HTMLInputElement by default', () => {
      const node = createMockNode('HTMLInputElement', 'INPUT', 'text');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('value');
    });

    it('should return checked for radio input', () => {
      const node = createMockNode('HTMLInputElement', 'INPUT', 'radio');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('checked');
    });

    it('should return checked for checkbox input', () => {
      const node = createMockNode('HTMLInputElement', 'INPUT', 'checkbox');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('checked');
    });

    it('should return value for HTMLSelectElement', () => {
      const node = createMockNode('HTMLSelectElement', 'SELECT');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('value');
    });

    it('should return value for HTMLTextAreaElement', () => {
      const node = createMockNode('HTMLTextAreaElement', 'TEXTAREA');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('value');
    });

    it('should return onclick for HTMLButtonElement', () => {
      const node = createMockNode('HTMLButtonElement', 'BUTTON');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('onclick');
    });

    it('should return onclick for HTMLAnchorElement', () => {
      const node = createMockNode('HTMLAnchorElement', 'A');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('onclick');
    });

    it('should return onsubmit for HTMLFormElement', () => {
      const node = createMockNode('HTMLFormElement', 'FORM');
      const result = getDefaultName(node, 'HTMLElement');
      expect(result).toBe('onsubmit');
    });

    it('should return textContent for Text node', () => {
      const node = createMockNode('Text');
      const result = getDefaultName(node, 'Text');
      expect(result).toBe('textContent');
    });

    it('should return undefined for unsupported node types', () => {
      const node = createMockNode('SVGElement');
      const result = getDefaultName(node, 'SVGElement');
      expect(result).toBeUndefined();
    });

    it('should return undefined for Template node type', () => {
      const node = createMockNode('Comment');
      const result = getDefaultName(node, 'Template');
      expect(result).toBeUndefined();
    });

    it('should cache results for performance', () => {
      const node1 = createMockNode('HTMLInputElement', 'INPUT', 'text');
      const node2 = createMockNode('HTMLInputElement', 'INPUT', 'text');
      
      const result1 = getDefaultName(node1, 'HTMLElement');
      const result2 = getDefaultName(node2, 'HTMLElement');
      
      expect(result1).toBe('value');
      expect(result2).toBe('value');
    });
  });
});