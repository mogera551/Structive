import { describe, it, expect } from 'vitest';
import { replaceTextNodeFromComment } from '../../src/BindingBuilder/replaceTextNodeFromComment.js';

describe('BindingBuilder', () => {
  describe('replaceTextNodeFromComment', () => {
    it('should replace comment node with text node for Text nodeType', () => {
      const parent = document.createElement('div');
      const comment = document.createComment('@@:user.name');
      
      parent.appendChild(comment);
      
      expect(parent.childNodes).toHaveLength(1);
      expect(parent.childNodes[0]).toBe(comment);
      expect(parent.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      
      const result = replaceTextNodeFromComment(comment, 'Text');
      
      expect(parent.childNodes).toHaveLength(1);
      expect(parent.childNodes[0]).toBe(result);
      expect(parent.childNodes[0]).not.toBe(comment);
      expect(result.nodeType).toBe(Node.TEXT_NODE);
      expect(result.textContent).toBe('');
    });

    it('should return same node for HTMLElement nodeType', () => {
      const parent = document.createElement('div');
      const element = document.createElement('span');
      
      parent.appendChild(element);
      
      const result = replaceTextNodeFromComment(element, 'HTMLElement');
      
      expect(result).toBe(element);
      expect(parent.childNodes[0]).toBe(element);
    });

    it('should return same node for SVGElement nodeType', () => {
      const parent = document.createElement('div');
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      parent.appendChild(svgElement);
      
      const result = replaceTextNodeFromComment(svgElement, 'SVGElement');
      
      expect(result).toBe(svgElement);
      expect(parent.childNodes[0]).toBe(svgElement);
    });

    it('should return same node for Template nodeType', () => {
      const parent = document.createElement('div');
      const comment = document.createComment('@@|template123');
      
      parent.appendChild(comment);
      
      const result = replaceTextNodeFromComment(comment, 'Template');
      
      expect(result).toBe(comment);
      expect(parent.childNodes[0]).toBe(comment);
    });

    it('should handle comment node without parent', () => {
      const comment = document.createComment('@@:user.name');
      
      // 親がない場合の動作確認
      const result = replaceTextNodeFromComment(comment, 'Text');
      
      // parentNode?.replaceChild のため、親がなければ何もしない
      expect(result.nodeType).toBe(Node.TEXT_NODE);
      expect(result.textContent).toBe('');
    });

    it('should preserve sibling nodes', () => {
      const parent = document.createElement('div');
      const beforeComment = document.createElement('span');
      const comment = document.createComment('@@:user.name');
      const afterComment = document.createElement('p');
      
      parent.appendChild(beforeComment);
      parent.appendChild(comment);
      parent.appendChild(afterComment);
      
      expect(parent.childNodes).toHaveLength(3);
      
      const result = replaceTextNodeFromComment(comment, 'Text');
      
      expect(parent.childNodes).toHaveLength(3);
      expect(parent.childNodes[0]).toBe(beforeComment);
      expect(parent.childNodes[1]).toBe(result);
      expect(parent.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(parent.childNodes[2]).toBe(afterComment);
    });

    it('should work with nested structure', () => {
      const root = document.createElement('div');
      const container = document.createElement('section');
      const comment = document.createComment('@@:nested.value');
      
      root.appendChild(container);
      container.appendChild(comment);
      
      const result = replaceTextNodeFromComment(comment, 'Text');
      
      expect(container.childNodes).toHaveLength(1);
      expect(container.childNodes[0]).toBe(result);
      expect(result.nodeType).toBe(Node.TEXT_NODE);
    });

    it('should handle multiple replacements', () => {
      const parent = document.createElement('div');
      const comment1 = document.createComment('@@:user.name');
      const comment2 = document.createComment('@@:user.email');
      
      parent.appendChild(comment1);
      parent.appendChild(comment2);
      
      const result1 = replaceTextNodeFromComment(comment1, 'Text');
      const result2 = replaceTextNodeFromComment(comment2, 'Text');
      
      expect(parent.childNodes).toHaveLength(2);
      expect(parent.childNodes[0]).toBe(result1);
      expect(parent.childNodes[1]).toBe(result2);
      expect(result1.nodeType).toBe(Node.TEXT_NODE);
      expect(result2.nodeType).toBe(Node.TEXT_NODE);
    });

    it('should create empty text node', () => {
      const parent = document.createElement('div');
      const comment = document.createComment('@@:some.content');
      
      parent.appendChild(comment);
      
      const result = replaceTextNodeFromComment(comment, 'Text');
      
      expect(result.textContent).toBe('');
      expect(result.nodeValue).toBe('');
    });
  });
});