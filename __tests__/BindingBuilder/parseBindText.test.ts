import { describe, it, expect } from 'vitest';
import { parseBindText } from '../../src/BindingBuilder/parseBindText.js';

describe('BindingBuilder', () => {
  describe('parseBindText', () => {
    it('should return empty array for empty string', () => {
      const result = parseBindText('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace string', () => {
      const result = parseBindText('   ');
      expect(result).toEqual([]);
    });

    it('should parse simple property binding', () => {
      const result = parseBindText('textContent:value');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      });
    });

    it('should parse binding with input filters', () => {
      const result = parseBindText('textContent|eq,100:value');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [{ name: 'eq', options: ['100'] }],
        outputFilterTexts: [],
        decorates: []
      });
    });

    it('should parse binding with output filters', () => {
      const result = parseBindText('textContent:value|falsey');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [],
        outputFilterTexts: [{ name: 'falsey', options: [] }],
        decorates: []
      });
    });

    it('should parse binding with multiple filters', () => {
      const result = parseBindText('textContent:value|eq,100|falsey');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [],
        outputFilterTexts: [
          { name: 'eq', options: ['100'] },
          { name: 'falsey', options: [] }
        ],
        decorates: []
      });
    });

    it('should parse filter with multiple options', () => {
      const result = parseBindText('textContent:value|between,10,20');
      expect(result).toHaveLength(1);
      expect(result[0].outputFilterTexts).toEqual([
        { name: 'between', options: ['10', '20'] }
      ]);
    });

    it('should parse binding with decorates', () => {
      const result = parseBindText('textContent:value@decorate1,decorate2');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: ['decorate1', 'decorate2']
      });
    });

    it('should parse complex binding with filters and decorates', () => {
      const result = parseBindText('textContent|trim:value|eq,100|falsey@decorate1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [{ name: 'trim', options: [] }],
        outputFilterTexts: [
          { name: 'eq', options: ['100'] },
          { name: 'falsey', options: [] }
        ],
        decorates: ['decorate1']
      });
    });

    it('should parse multiple bindings separated by semicolon', () => {
      const result = parseBindText('textContent:value1; onclick:value2');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value1',
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      });
      expect(result[1]).toEqual({
        nodeProperty: 'onclick',
        stateProperty: 'value2',
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      });
    });

    it('should handle encoded filter options', () => {
      const result = parseBindText('textContent:value|eq,#hello%20world#');
      expect(result).toHaveLength(1);
      expect(result[0].outputFilterTexts[0]).toEqual({
        name: 'eq',
        options: ['hello world'] // デコードされる
      });
    });

    it('should ignore empty expressions in semicolon-separated list', () => {
      const result = parseBindText('textContent:value1; ; onclick:value2;');
      expect(result).toHaveLength(2);
      expect(result[0].nodeProperty).toBe('textContent');
      expect(result[1].nodeProperty).toBe('onclick');
    });

    it('should handle whitespace in expressions', () => {
      const result = parseBindText('  textContent : value | eq , 100  ');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nodeProperty: 'textContent',
        stateProperty: 'value',
        inputFilterTexts: [],
        outputFilterTexts: [{ name: 'eq', options: ['100'] }],
        decorates: []
      });
    });

    it('should cache parsing results', () => {
      const text = 'textContent:value';
      const result1 = parseBindText(text);
      const result2 = parseBindText(text);
      
      expect(result1).toBe(result2); // 同じオブジェクト参照（キャッシュされている）
    });
  });
});