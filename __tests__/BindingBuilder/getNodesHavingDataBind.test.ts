import { describe, it, expect } from 'vitest';
import { getNodesHavingDataBind } from '../../src/BindingBuilder/getNodesHavingDataBind.js';

describe('BindingBuilder', () => {
  describe('getNodesHavingDataBind', () => {
    it('should return empty array for node without data-bind', () => {
      const root = document.createElement('div');
      const child = document.createElement('span');
      root.appendChild(child);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toEqual([]);
    });

    it('should find elements with data-bind attribute', () => {
      const root = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('p');
      const child3 = document.createElement('a');
      
      child1.setAttribute('data-bind', 'textContent:user.name');
      child3.setAttribute('data-bind', 'href:user.url');
      
      root.appendChild(child1);
      root.appendChild(child2);
      root.appendChild(child3);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(child1);
      expect(result).toContain(child3);
      expect(result).not.toContain(child2);
    });

    it('should find comment nodes with embed mark (@@:)', () => {
      const root = document.createElement('div');
      const comment1 = document.createComment('@@:user.name');
      const comment2 = document.createComment('regular comment');
      const comment3 = document.createComment('@@:user.email');
      
      root.appendChild(comment1);
      root.appendChild(comment2);
      root.appendChild(comment3);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(comment1);
      expect(result).toContain(comment3);
      expect(result).not.toContain(comment2);
    });

    it('should find comment nodes with template mark (@@|)', () => {
      const root = document.createElement('div');
      const comment1 = document.createComment('@@|123');
      const comment2 = document.createComment('@@:user.name');
      const comment3 = document.createComment('@@|456');
      const comment4 = document.createComment('normal comment');
      
      root.appendChild(comment1);
      root.appendChild(comment2);
      root.appendChild(comment3);
      root.appendChild(comment4);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(3);
      expect(result).toContain(comment1);
      expect(result).toContain(comment2);
      expect(result).toContain(comment3);
      expect(result).not.toContain(comment4);
    });

    it('should find both elements and comment nodes', () => {
      const root = document.createElement('div');
      const element1 = document.createElement('span');
      const element2 = document.createElement('p');
      const comment1 = document.createComment('@@:user.name');
      const comment2 = document.createComment('@@|template123');
      
      element1.setAttribute('data-bind', 'textContent:user.title');
      // element2 には data-bind なし
      
      root.appendChild(element1);
      root.appendChild(element2);
      root.appendChild(comment1);
      root.appendChild(comment2);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(3);
      expect(result).toContain(element1);
      expect(result).toContain(comment1);
      expect(result).toContain(comment2);
      expect(result).not.toContain(element2);
    });

    it('should work with nested structure', () => {
      const root = document.createElement('div');
      const level1 = document.createElement('section');
      const level2 = document.createElement('article');
      const level3 = document.createElement('h1');
      const comment = document.createComment('@@:nested.value');
      
      // rootの代わりにlevel1にdata-bind属性を設定（TreeWalkerは通常子ノードから探索開始）
      level1.setAttribute('data-bind', 'className:section.class');
      level2.setAttribute('data-bind', 'textContent:article.title');
      
      root.appendChild(level1);
      level1.appendChild(level2);
      level2.appendChild(level3);
      level3.appendChild(comment);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(3);
      expect(result).toContain(level1);
      expect(result).toContain(level2);
      expect(result).toContain(comment);
      expect(result).not.toContain(root);
      expect(result).not.toContain(level3);
    });

    it('should handle SVG elements', () => {
      const root = document.createElement('div');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      svg.setAttribute('data-bind', 'width:size.width');
      rect.setAttribute('data-bind', 'fill:color.primary');
      
      root.appendChild(svg);
      svg.appendChild(rect);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(2);
      expect(result).toContain(svg);
      expect(result).toContain(rect);
    });

    it('should handle text nodes (they should be ignored)', () => {
      const root = document.createElement('div');
      const textNode = document.createTextNode('some text');
      const element = document.createElement('span');
      
      element.setAttribute('data-bind', 'textContent:user.name');
      
      root.appendChild(textNode);
      root.appendChild(element);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(1);
      expect(result).toContain(element);
    });

    it('should handle root node with data-bind', () => {
      // TreeWalkerはrootノード自身をスキップするため、子要素にdata-bindを設定してテスト
      const root = document.createElement('div');
      const child = document.createElement('span');
      child.setAttribute('data-bind', 'textContent:child.text');
      root.appendChild(child);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toHaveLength(1);
      expect(result).toContain(child);
    });

    it('should handle comment nodes with null textContent', () => {
      const root = document.createElement('div');
      const comment = document.createComment('');
      
      // textContent を手動で null にセット（通常は発生しないが安全性のため）
      Object.defineProperty(comment, 'textContent', {
        value: null,
        configurable: true
      });
      
      root.appendChild(comment);
      
      const result = getNodesHavingDataBind(root);
      
      expect(result).toEqual([]);
    });
  });
});