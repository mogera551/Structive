import { describe, it, expect, beforeEach } from 'vitest';
import { generateId } from '../../src/GlobalId/generateId.js';

// IDカウンターをリセットする内部関数をテスト用に追加する必要があるかもしれません
// 現在の実装では、テスト間でIDが共有されるため、順次増加します

describe('GlobalId', () => {
  describe('generateId', () => {
    it('should return incremental numbers', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();
      
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
      expect(typeof id3).toBe('number');
      
      expect(id2).toBe(id1 + 1);
      expect(id3).toBe(id2 + 1);
    });

    it('should always return unique IDs', () => {
      const ids = new Set();
      
      for (let i = 0; i < 100; i++) {
        const id = generateId();
        expect(ids.has(id)).toBe(false); // IDが重複しないことを確認
        ids.add(id);
      }
      
      expect(ids.size).toBe(100);
    });

    it('should return positive integers', () => {
      const id = generateId();
      
      expect(id).toBeGreaterThan(0);
      expect(Number.isInteger(id)).toBe(true);
    });
  });
});