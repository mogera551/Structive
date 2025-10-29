import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDataBindText } from '../../src/BindingBuilder/getDataBindText.js';
import * as templateModule from '../../src/Template/registerTemplate.js';

// モック関数を作成
vi.mock('../../src/Template/registerTemplate.js', () => ({
  getTemplateById: vi.fn()
}));

const mockGetTemplateById = vi.mocked(templateModule.getTemplateById);

// DOM環境をモック
const createMockNode = (constructor: string, nodeType?: number, textContent?: string, attributes?: Record<string, string>) => {
  const node = {
    constructor: { name: constructor },
    nodeType: nodeType,
    textContent: textContent,
    getAttribute: (name: string) => attributes?.[name] || null
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

const createMockTemplate = (dataBindValue?: string) => ({
  getAttribute: (name: string) => name === 'data-bind' ? (dataBindValue || null) : null
});

describe('BindingBuilder', () => {
  describe('getDataBindText', () => {
    beforeEach(() => {
      mockGetTemplateById.mockReset();
    });

    it('should return textContent binding for Text node', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@:user.name');
      const result = getDataBindText('Text', node);
      expect(result).toBe('textContent:user.name');
    });

    it('should handle Text node with whitespace', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@:  user.name  ');
      const result = getDataBindText('Text', node);
      expect(result).toBe('textContent:user.name');
    });

    it('should handle Text node with empty content', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@:');
      const result = getDataBindText('Text', node);
      expect(result).toBe('textContent:');
    });

    it('should return data-bind attribute for HTMLElement', () => {
      const node = createMockNode('HTMLDivElement', Node.ELEMENT_NODE, undefined, {
        'data-bind': 'value:user.name'
      });
      const result = getDataBindText('HTMLElement', node);
      expect(result).toBe('value:user.name');
    });

    it('should return empty string for HTMLElement without data-bind', () => {
      const node = createMockNode('HTMLDivElement', Node.ELEMENT_NODE);
      const result = getDataBindText('HTMLElement', node);
      expect(result).toBe('');
    });

    it('should return data-bind attribute for SVGElement', () => {
      const node = createMockNode('SVGSVGElement', Node.ELEMENT_NODE, undefined, {
        'data-bind': 'width:size.width'
      });
      const result = getDataBindText('SVGElement', node);
      expect(result).toBe('width:size.width');
    });

    it('should return empty string for SVGElement without data-bind', () => {
      const node = createMockNode('SVGSVGElement', Node.ELEMENT_NODE);
      const result = getDataBindText('SVGElement', node);
      expect(result).toBe('');
    });

    it('should return template data-bind for Template node', () => {
      const mockTemplate = createMockTemplate('textContent:template.content');
      mockGetTemplateById.mockReturnValue(mockTemplate as any);
      
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@|123');
      const result = getDataBindText('Template', node);
      
      expect(mockGetTemplateById).toHaveBeenCalledWith(123);
      expect(result).toBe('textContent:template.content');
    });

    it('should handle Template node with whitespace', () => {
      const mockTemplate = createMockTemplate('value:data');
      mockGetTemplateById.mockReturnValue(mockTemplate as any);
      
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@|  456  ');
      const result = getDataBindText('Template', node);
      
      expect(mockGetTemplateById).toHaveBeenCalledWith(456);
      expect(result).toBe('value:data');
    });

    it('should throw error when template not found', () => {
      mockGetTemplateById.mockReturnValue(undefined as any);
      
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@|999');
      expect(() => getDataBindText('Template', node)).toThrow('Template not found: 999');
    });

    it('should return empty string for template without data-bind', () => {
      const mockTemplate = createMockTemplate();
      mockGetTemplateById.mockReturnValue(mockTemplate as any);
      
      const node = createMockNode('Comment', Node.COMMENT_NODE, '@@|123');
      const result = getDataBindText('Template', node);
      
      expect(result).toBe('');
    });

    it('should return empty string for unsupported node type', () => {
      const node = createMockNode('UnknownNode');
      const result = getDataBindText('Unsupported' as any, node);
      expect(result).toBe('');
    });

    it('should handle node with null textContent', () => {
      const node = createMockNode('Comment', Node.COMMENT_NODE, undefined);
      const result = getDataBindText('Text', node);
      expect(result).toBe('textContent:');
    });
  });
});