import { describe, it, expect } from 'vitest';
import { removeDataBindAttribute } from '../../src/BindingBuilder/removeDataBindAttribute.js';

describe('BindingBuilder', () => {
  describe('removeDataBindAttribute', () => {
    it('should remove data-bind attribute from HTMLElement', () => {
      const element = document.createElement('div');
      element.setAttribute('data-bind', 'value:user.name');
      
      expect(element.getAttribute('data-bind')).toBe('value:user.name');
      
      removeDataBindAttribute(element, 'HTMLElement');
      
      expect(element.getAttribute('data-bind')).toBeNull();
    });

    it('should remove data-bind attribute from SVGElement', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element.setAttribute('data-bind', 'width:size.width');
      
      expect(element.getAttribute('data-bind')).toBe('width:size.width');
      
      removeDataBindAttribute(element, 'SVGElement');
      
      expect(element.getAttribute('data-bind')).toBeNull();
    });

    it('should handle HTMLElement without data-bind attribute', () => {
      const element = document.createElement('div');
      
      expect(() => removeDataBindAttribute(element, 'HTMLElement')).not.toThrow();
      expect(element.getAttribute('data-bind')).toBeNull();
    });

    it('should do nothing for Text node', () => {
      const textNode = document.createTextNode('test');
      
      expect(() => removeDataBindAttribute(textNode, 'Text')).not.toThrow();
    });

    it('should do nothing for Template node', () => {
      const comment = document.createComment('@@|template');
      
      expect(() => removeDataBindAttribute(comment, 'Template')).not.toThrow();
    });

    it('should handle element with multiple attributes', () => {
      const element = document.createElement('input');
      element.setAttribute('type', 'text');
      element.setAttribute('data-bind', 'value:user.name');
      element.setAttribute('class', 'form-control');
      
      removeDataBindAttribute(element, 'HTMLElement');
      
      expect(element.getAttribute('data-bind')).toBeNull();
      expect(element.getAttribute('type')).toBe('text');
      expect(element.getAttribute('class')).toBe('form-control');
    });

    it('should return undefined', () => {
      const element = document.createElement('div');
      element.setAttribute('data-bind', 'value:test');
      
      const result = removeDataBindAttribute(element, 'HTMLElement');
      
      expect(result).toBeUndefined();
    });
  });
});