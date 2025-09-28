import { describe, it, expect } from 'vitest';
import { resolveNodeFromPath } from '../../src/BindingBuilder/resolveNodeFromPath.js';

describe('BindingBuilder', () => {
  describe('resolveNodeFromPath', () => {
    it('should return root node for empty path', () => {
      const root = document.createElement('div');
      
      const result = resolveNodeFromPath(root, []);
      
      expect(result).toBe(root);
    });

    it('should resolve single level path', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('p');
      const child3 = document.createElement('a');
      
      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);
      
      expect(resolveNodeFromPath(parent, [0])).toBe(child1);
      expect(resolveNodeFromPath(parent, [1])).toBe(child2);
      expect(resolveNodeFromPath(parent, [2])).toBe(child3);
    });

    it('should resolve multi-level path', () => {
      const root = document.createElement('div');
      const level1 = document.createElement('section');
      const level1_sibling = document.createElement('aside');
      const level2 = document.createElement('article');
      const level3 = document.createElement('h1');
      
      root.appendChild(level1);
      root.appendChild(level1_sibling);
      level1.appendChild(level2);
      level2.appendChild(level3);
      
      expect(resolveNodeFromPath(root, [0])).toBe(level1);
      expect(resolveNodeFromPath(root, [1])).toBe(level1_sibling);
      expect(resolveNodeFromPath(root, [0, 0])).toBe(level2);
      expect(resolveNodeFromPath(root, [0, 0, 0])).toBe(level3);
    });

    it('should return null for invalid path index', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      
      parent.appendChild(child);
      
      expect(resolveNodeFromPath(parent, [1])).toBeNull(); // インデックス1は存在しない
      expect(resolveNodeFromPath(parent, [5])).toBeNull(); // インデックス5は存在しない
      expect(resolveNodeFromPath(parent, [-1])).toBeNull(); // 負のインデックス
    });

    it('should return null for path that goes too deep', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      
      parent.appendChild(child);
      
      // childは子を持たないので、さらに深いパスは無効
      expect(resolveNodeFromPath(parent, [0, 0])).toBeNull();
    });

    it('should handle text nodes', () => {
      const parent = document.createElement('div');
      const textNode1 = document.createTextNode('first');
      const element = document.createElement('span');
      const textNode2 = document.createTextNode('second');
      
      parent.appendChild(textNode1);
      parent.appendChild(element);
      parent.appendChild(textNode2);
      
      expect(resolveNodeFromPath(parent, [0])).toBe(textNode1);
      expect(resolveNodeFromPath(parent, [1])).toBe(element);
      expect(resolveNodeFromPath(parent, [2])).toBe(textNode2);
    });

    it('should handle comment nodes', () => {
      const parent = document.createElement('div');
      const comment = document.createComment('test comment');
      const element = document.createElement('span');
      
      parent.appendChild(comment);
      parent.appendChild(element);
      
      expect(resolveNodeFromPath(parent, [0])).toBe(comment);
      expect(resolveNodeFromPath(parent, [1])).toBe(element);
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
      
      expect(resolveNodeFromPath(root, [0])).toBe(head);
      expect(resolveNodeFromPath(root, [1])).toBe(body);
      expect(resolveNodeFromPath(root, [1, 0])).toBe(div);
      expect(resolveNodeFromPath(root, [1, 0, 0])).toBe(span1);
      expect(resolveNodeFromPath(root, [1, 0, 1])).toBe(span2);
    });

    it('should return null when path becomes invalid midway', () => {
      const root = document.createElement('div');
      const child = document.createElement('span');
      
      root.appendChild(child);
      
      // [0, 1] のパス: 0番目の子(span)は存在するが、その1番目の子は存在しない
      expect(resolveNodeFromPath(root, [0, 1])).toBeNull();
    });

    it('should handle document fragment', () => {
      const fragment = document.createDocumentFragment();
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      const span = document.createElement('span');
      
      fragment.appendChild(div1);
      fragment.appendChild(div2);
      div1.appendChild(span);
      
      expect(resolveNodeFromPath(fragment, [0])).toBe(div1);
      expect(resolveNodeFromPath(fragment, [1])).toBe(div2);
      expect(resolveNodeFromPath(fragment, [0, 0])).toBe(span);
    });
  });
});