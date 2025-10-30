import { describe, it, expect, beforeEach } from 'vitest';
import { createListIndex } from '../../src/ListIndex/ListIndex.js';
import { IListIndex } from '../../src/ListIndex/types.js';

describe('ListIndex', () => {
  describe('createListIndex', () => {
    it('should create a root ListIndex when parentListIndex is null', () => {
      const listIndex = createListIndex(null, 5);
      
      expect(listIndex.parentListIndex).toBeNull();
      expect(listIndex.index).toBe(5);
      expect(listIndex.position).toBe(0);
      expect(listIndex.length).toBe(1);
      expect(listIndex.indexes).toEqual([5]);
      expect(listIndex.indexes).toBe(listIndex.indexes); // キャッシュ済み分岐
      expect(listIndex.varName).toBe('1');
      expect(typeof listIndex.id).toBe('number');
      expect(typeof listIndex.sid).toBe('string');
      expect(listIndex.dirty).toBe(false);
      const rootListRefs = listIndex.listIndexes;
      expect(rootListRefs).toHaveLength(1);
      expect(rootListRefs[0]?.deref()).toBe(listIndex);
      expect(listIndex.listIndexes).toBe(rootListRefs);
    });

    it('should create a nested ListIndex when parentListIndex is provided', () => {
      const parent = createListIndex(null, 2);
      const child = createListIndex(parent, 7);
      
      expect(child.parentListIndex).toBe(parent);
      expect(child.index).toBe(7);
      expect(child.position).toBe(1);
      expect(child.length).toBe(2);
      expect(child.indexes).toEqual([2, 7]);
      const cachedIndexes = child.indexes;
      expect(child.indexes).toBe(cachedIndexes); // dirty false 分岐
      expect(child.varName).toBe('2');
      const firstRefs = child.listIndexes;
      expect(child.listIndexes).toBe(firstRefs); // listIndexes キャッシュ確認
    });

    it('should create deeply nested ListIndex', () => {
      const root = createListIndex(null, 1);
      const level1 = createListIndex(root, 2);
      const level2 = createListIndex(level1, 3);
      
      expect(level2.position).toBe(2);
      expect(level2.length).toBe(3);
      expect(level2.indexes).toEqual([1, 2, 3]);
      expect(level2.varName).toBe('3');
    });

    it('should handle index updates', () => {
      const listIndex = createListIndex(null, 10);
      const originalVersion = listIndex.version;
      
      listIndex.index = 20;
      
      expect(listIndex.index).toBe(20);
      expect(listIndex.indexes).toEqual([20]);
      expect(listIndex.version).toBeGreaterThan(originalVersion);
    });

    it('should handle dirty state for nested indexes', () => {
      const parent = createListIndex(null, 1);
      const child = createListIndex(parent, 2);
      
      expect(child.dirty).toBe(false);
      
      // 親のインデックスを更新すると、子がdirtyになる
      parent.index = 5;
      
      expect(child.dirty).toBe(true);
      
      // 子のindexesにアクセスすると、再計算される
      expect(child.indexes).toEqual([5, 2]);
      expect(child.dirty).toBe(false);
      const recalculated = child.indexes;
      expect(child.indexes).toBe(recalculated);
      const listRefs = child.listIndexes;
      expect(listRefs[listRefs.length - 1]?.deref()).toBe(child);
    });

    it('should provide correct at() access', () => {
      const root = createListIndex(null, 0);
      const level1 = createListIndex(root, 1);
      const level2 = createListIndex(level1, 2);
      
      expect(level2.at(0)).toBe(root);
      expect(level2.at(1)).toBe(level1);
      expect(level2.at(2)).toBe(level2);
      expect(level2.at(-1)).toBe(level2);
      expect(level2.at(-2)).toBe(level1);
      expect(level2.at(-3)).toBe(root);
      expect(level2.at(-4)).toBeNull();
      expect(level2.at(3)).toBeNull();
    });

    it('should generate unique IDs', () => {
      const listIndex1 = createListIndex(null, 1);
      const listIndex2 = createListIndex(null, 2);
      
      expect(listIndex1.id).not.toBe(listIndex2.id);
      expect(listIndex1.sid).not.toBe(listIndex2.sid);
    });
  });
});