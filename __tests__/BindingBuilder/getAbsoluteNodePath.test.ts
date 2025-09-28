import { describe, it, expect } from 'vitest';
import { getAbsoluteNodePath } from '../../src/BindingBuilder/getAbsoluteNodePath.js';

describe('BindingBuilder', () => {
  describe('getAbsoluteNodePath', () => {
    it('should return empty array for root node', () => {
      const root = document.createElement('div');
      
      const path = getAbsoluteNodePath(root);
      
      expect(path).toEqual([]);
    });

    it('should return correct path for single child', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('p');
      const child3 = document.createElement('a');
      
      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);
      
      expect(getAbsoluteNodePath(child1)).toEqual([0]);
      expect(getAbsoluteNodePath(child2)).toEqual([1]);
      expect(getAbsoluteNodePath(child3)).toEqual([2]);
    });

    it('should return correct path for nested elements', () => {
      const root = document.createElement('div');
      const level1 = document.createElement('section');
      const level1_sibling = document.createElement('aside');
      const level2 = document.createElement('article');
      const level3 = document.createElement('h1');
      
      root.appendChild(level1);
      root.appendChild(level1_sibling);
      level1.appendChild(level2);
      level2.appendChild(level3);
      
      expect(getAbsoluteNodePath(level1)).toEqual([0]);
      expect(getAbsoluteNodePath(level1_sibling)).toEqual([1]);
      expect(getAbsoluteNodePath(level2)).toEqual([0, 0]);
      expect(getAbsoluteNodePath(level3)).toEqual([0, 0, 0]);
    });

    it('should handle text nodes correctly', () => {
      const parent = document.createElement('div');
      const textNode1 = document.createTextNode('first');
      const element = document.createElement('span');
      const textNode2 = document.createTextNode('second');
      
      parent.appendChild(textNode1);
      parent.appendChild(element);
      parent.appendChild(textNode2);
      
      expect(getAbsoluteNodePath(textNode1)).toEqual([0]);
      expect(getAbsoluteNodePath(element)).toEqual([1]);
      expect(getAbsoluteNodePath(textNode2)).toEqual([2]);
    });

    it('should handle comment nodes correctly', () => {
      const parent = document.createElement('div');
      const comment = document.createComment('test comment');
      const element = document.createElement('span');
      
      parent.appendChild(comment);
      parent.appendChild(element);
      
      expect(getAbsoluteNodePath(comment)).toEqual([0]);
      expect(getAbsoluteNodePath(element)).toEqual([1]);
    });

    it('should handle complex nested structure', () => {
      const root = document.createElement('html');
      const head = document.createElement('head');
      const body = document.createElement('body');
      const div = document.createElement('div');
      const span1 = document.createElement('span');
      const span2 = document.createElement('span');
      
      root.appendChild(head);
      root.appendChild(body);
      body.appendChild(div);
      div.appendChild(span1);
      div.appendChild(span2);
      
      expect(getAbsoluteNodePath(head)).toEqual([0]);
      expect(getAbsoluteNodePath(body)).toEqual([1]);
      expect(getAbsoluteNodePath(div)).toEqual([1, 0]);
      expect(getAbsoluteNodePath(span1)).toEqual([1, 0, 0]);
      expect(getAbsoluteNodePath(span2)).toEqual([1, 0, 1]);
    });

    it('should handle document fragment', () => {
      const fragment = document.createDocumentFragment();
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      
      fragment.appendChild(div1);
      fragment.appendChild(div2);
      
      expect(getAbsoluteNodePath(div1)).toEqual([0]);
      expect(getAbsoluteNodePath(div2)).toEqual([1]);
    });
  });
});