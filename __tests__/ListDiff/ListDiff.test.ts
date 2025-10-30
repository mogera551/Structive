import { describe, it, expect } from 'vitest';
import { calcListDiff } from '../../src/ListDiff/ListDiff.js';
import { createListIndex } from '../../src/ListIndex/ListIndex.js';

describe('ListDiff', () => {
  describe('calcListDiff', () => {
    it('should handle identical lists', () => {
      const listValue = ['a', 'b', 'c'];
      const oldIndexes = [
        createListIndex(null, 0),
        createListIndex(null, 1),
        createListIndex(null, 2)
      ];
      
      const result = calcListDiff(null, listValue, listValue, oldIndexes);
      
      expect(result.oldListValue).toBe(listValue);
      expect(result.newListValue).toBe(listValue);
      expect(result.oldIndexes).toBe(oldIndexes);
      expect(result.newIndexes).toBe(oldIndexes);
      expect(result.adds).toBeUndefined();
      expect(result.removes).toBeUndefined();
    });

    it('should handle empty to non-empty list', () => {
      const newListValue = ['a', 'b', 'c'];
      
      const result = calcListDiff(null, [], newListValue, []);
      
      expect(result.newIndexes).toHaveLength(3);
      expect(result.adds).toBeDefined();
      expect(result.adds!.size).toBe(3);
      expect(result.removes).toBeUndefined();
      
      // インデックスが正しく設定されているかチェック
      const newIndexesArray = Array.from(result.newIndexes);
      expect(newIndexesArray[0].index).toBe(0);
      expect(newIndexesArray[1].index).toBe(1);
      expect(newIndexesArray[2].index).toBe(2);
    });

    it('should handle non-empty to empty list', () => {
      const oldListValue = ['a', 'b', 'c'];
      const oldIndexes = [
        createListIndex(null, 0),
        createListIndex(null, 1),
        createListIndex(null, 2)
      ];
      
      const result = calcListDiff(null, oldListValue, [], oldIndexes);
      
      expect(result.newIndexes).toHaveLength(0);
      expect(result.removes).toBeDefined();
      expect(result.removes!.size).toBe(3);
      expect(result.adds).toBeUndefined();
    });

    it('should handle list with additions', () => {
      const oldListValue = ['a', 'b'];
      const newListValue = ['a', 'b', 'c', 'd'];
      const oldIndexes = [
        createListIndex(null, 0),
        createListIndex(null, 1)
      ];
      
      const result = calcListDiff(null, oldListValue, newListValue, oldIndexes);
      
      expect(result.newIndexes).toHaveLength(4);
      expect(result.adds).toBeDefined();
      expect(result.adds!.size).toBe(2); // 'c' and 'd' が追加
      expect(result.removes).toBeDefined();
      expect(result.removes!.size).toBe(0); // 削除されるものはない
    });

    it('should handle list with removals', () => {
      const oldListValue = ['a', 'b', 'c', 'd'];
      const newListValue = ['a', 'c'];
      const oldIndexes = [
        createListIndex(null, 0),
        createListIndex(null, 1),
        createListIndex(null, 2),
        createListIndex(null, 3)
      ];
      
      const result = calcListDiff(null, oldListValue, newListValue, oldIndexes);
      
      expect(result.newIndexes).toHaveLength(2);
      expect(result.adds).toBeDefined();
      expect(result.adds!.size).toBe(0); // 新規追加はない
      expect(result.removes).toBeDefined();
      expect(result.removes!.size).toBe(2); // 'b' and 'd' が削除
    });

    it('should handle list with index changes', () => {
      const oldListValue = ['a', 'b', 'c'];
      const newListValue = ['c', 'a', 'b'];
      const oldIndexes = [
        createListIndex(null, 0), // 'a'
        createListIndex(null, 1), // 'b' 
        createListIndex(null, 2)  // 'c'
      ];
      
      const result = calcListDiff(null, oldListValue, newListValue, oldIndexes);
      
      expect(result.newIndexes).toHaveLength(3);
      expect(result.adds).toBeDefined();
      expect(result.adds!.size).toBe(0); // 新規追加はない
      expect(result.removes).toBeDefined();
      expect(result.removes!.size).toBe(0); // 削除もない
      expect(result.changeIndexes).toBeDefined();
      expect(result.changeIndexes!.size).toBe(3); // 全てのインデックスが変更
    });

    it('should recognise same-content arrays as unchanged even if references differ', () => {
      const oldListValue = ['x', 'y', 'z'];
      const newListValue = ['x', 'y', 'z'];
      const oldIndexes = [
        createListIndex(null, 0),
        createListIndex(null, 1),
        createListIndex(null, 2)
      ];

      const result = calcListDiff(null, oldListValue, newListValue, oldIndexes);

      expect(result.same).toBe(true);
      expect(result.newIndexes).toBe(oldIndexes);
      expect(result.adds).toBeUndefined();
      expect(result.removes).toBeUndefined();
      expect(result.changeIndexes).toBeUndefined();
    });

    it('should handle null/undefined values', () => {
      const result1 = calcListDiff(null, null, null, null);
      expect(result1.newIndexes).toHaveLength(0);
      
      const result2 = calcListDiff(null, undefined, undefined, undefined);
      expect(result2.newIndexes).toHaveLength(0);
    });
  });
});