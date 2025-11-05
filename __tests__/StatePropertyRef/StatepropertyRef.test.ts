/**
 * StatepropertyRef.test.ts
 *
 * StatepropertyRef.tsの単体テスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStatePropertyRef } from '../../src/StatePropertyRef/StatepropertyRef';
import { getStructuredPathInfo } from '../../src/StateProperty/getStructuredPathInfo';
import { createListIndex } from '../../src/ListIndex/ListIndex';
import type { IStructuredPathInfo } from '../../src/StateProperty/types';
import type { IListIndex } from '../../src/ListIndex/types';
import type { IStatePropertyRef } from '../../src/StatePropertyRef/types';

describe('StatePropertyRef', () => {
  let pathInfo1: IStructuredPathInfo;
  let pathInfo2: IStructuredPathInfo;
  let listIndex1: IListIndex;
  let listIndex2: IListIndex;

  beforeEach(() => {
    // テスト用のパス情報を作成
    pathInfo1 = getStructuredPathInfo('items.*.name');
    pathInfo2 = getStructuredPathInfo('data.*.value');
    
    // テスト用のリストインデックスを作成
    listIndex1 = createListIndex(null, 0);
    listIndex2 = createListIndex(null, 1);
  });

  describe('基本的な StatePropertyRef 作成', () => {
    it('リストインデックスありで StatePropertyRef を作成できる', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      expect(ref).toBeDefined();
      expect(ref.info).toBe(pathInfo1);
      expect(ref.listIndex).toBe(listIndex1);
      expect(ref.key).toContain(pathInfo1.sid);
      expect(ref.key).toContain('#');
      expect(ref.key).toContain(listIndex1.sid);
    });

    it('リストインデックスなし（null）で StatePropertyRef を作成できる', () => {
      const ref = getStatePropertyRef(pathInfo1, null);
      
      expect(ref).toBeDefined();
      expect(ref.info).toBe(pathInfo1);
      expect(ref.listIndex).toBeNull();
      expect(ref.key).toBe(pathInfo1.sid);
      expect(ref.key).not.toContain('#');
    });

    it('異なるパス情報で異なる StatePropertyRef を作成できる', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo2, listIndex1);
      
      expect(ref1).not.toBe(ref2);
      expect(ref1.info).toBe(pathInfo1);
      expect(ref2.info).toBe(pathInfo2);
      expect(ref1.key).not.toBe(ref2.key);
    });

    it('異なるリストインデックスで異なる StatePropertyRef を作成できる', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo1, listIndex2);
      
      expect(ref1).not.toBe(ref2);
      expect(ref1.listIndex).toBe(listIndex1);
      expect(ref2.listIndex).toBe(listIndex2);
      expect(ref1.key).not.toBe(ref2.key);
    });
  });

  describe('キャッシュ機能', () => {
    it('同じパス情報・リストインデックスでは同じインスタンスを返す', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo1, listIndex1);
      
      expect(ref1).toBe(ref2);
    });

    it('同じパス情報・nullリストインデックスでは同じインスタンスを返す', () => {
      const ref1 = getStatePropertyRef(pathInfo1, null);
      const ref2 = getStatePropertyRef(pathInfo1, null);
      
      expect(ref1).toBe(ref2);
    });

    it('リストインデックスありとなしでは別のインスタンスを返す', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo1, null);
      
      expect(ref1).not.toBe(ref2);
      expect(ref1.key).not.toBe(ref2.key);
    });

    it('複数の異なる組み合わせが正しくキャッシュされる', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo1, listIndex2);
      const ref3 = getStatePropertyRef(pathInfo2, listIndex1);
      const ref4 = getStatePropertyRef(pathInfo2, null);
      
      // 同じ組み合わせで再取得すると同じインスタンス
      expect(getStatePropertyRef(pathInfo1, listIndex1)).toBe(ref1);
      expect(getStatePropertyRef(pathInfo1, listIndex2)).toBe(ref2);
      expect(getStatePropertyRef(pathInfo2, listIndex1)).toBe(ref3);
      expect(getStatePropertyRef(pathInfo2, null)).toBe(ref4);
      
      // 異なる組み合わせは異なるインスタンス
      const allRefs = [ref1, ref2, ref3, ref4];
      for (let i = 0; i < allRefs.length; i++) {
        for (let j = i + 1; j < allRefs.length; j++) {
          expect(allRefs[i]).not.toBe(allRefs[j]);
        }
      }
    });
  });

  describe('key プロパティの生成', () => {
    it('リストインデックスありの場合、info.sid + "#" + listIndex.sid 形式', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      const expectedKey = pathInfo1.sid + '#' + listIndex1.sid;
      
      expect(ref.key).toBe(expectedKey);
    });

    it('リストインデックスなしの場合、info.sid のみ', () => {
      const ref = getStatePropertyRef(pathInfo1, null);
      
      expect(ref.key).toBe(pathInfo1.sid);
    });

    it('異なるリストインデックスでは異なるキーを生成', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo1, listIndex2);
      
      expect(ref1.key).not.toBe(ref2.key);
      expect(ref1.key).toContain(listIndex1.sid);
      expect(ref2.key).toContain(listIndex2.sid);
    });

    it('同じパス情報でもリストインデックスの有無でキーが変わる', () => {
      const refWithIndex = getStatePropertyRef(pathInfo1, listIndex1);
      const refWithoutIndex = getStatePropertyRef(pathInfo1, null);
      
      expect(refWithIndex.key).not.toBe(refWithoutIndex.key);
      expect(refWithIndex.key).toContain('#');
      expect(refWithoutIndex.key).not.toContain('#');
    });
  });

  describe('WeakRef の動作', () => {
    it('リストインデックスが有効な場合、listIndex を正しく返す', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      expect(ref.listIndex).toBe(listIndex1);
    });

    it('リストインデックスがnullの場合、listIndex も null を返す', () => {
      const ref = getStatePropertyRef(pathInfo1, null);
      
      expect(ref.listIndex).toBeNull();
    });

    it('WeakRef が生きている間は同じリストインデックスを返す', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      // 複数回アクセスしても同じインスタンス
      expect(ref.listIndex).toBe(listIndex1);
      expect(ref.listIndex).toBe(listIndex1);
      expect(ref.listIndex).toBe(listIndex1);
    });

    it('WeakRef.deref が undefined を返す場合は LIST-201 エラーを投げる', () => {
      const originalWeakRef = globalThis.WeakRef;
      class DeadWeakRef<T extends object> {
        constructor(_: T) {}
        deref(): T | undefined {
          return undefined;
        }
      }

      (globalThis as any).WeakRef = DeadWeakRef;
      const errorPathInfo = getStructuredPathInfo('gc.case.path');
      const errorListIndex = createListIndex(null, 99);

      try {
        const ref = getStatePropertyRef(errorPathInfo, errorListIndex);
        expect(() => ref.listIndex).toThrowError(/listIndex is null/);
      } finally {
        (globalThis as any).WeakRef = originalWeakRef;
      }
    });
  });

  describe('WeakMap によるメモリ管理', () => {
    it('新しいリストインデックスに対して新しいMapを作成', () => {
      const newListIndex = createListIndex(null, 2);
      const ref = getStatePropertyRef(pathInfo1, newListIndex);
      
      expect(ref).toBeDefined();
      expect(ref.listIndex).toBe(newListIndex);
    });

    it('同一リストインデックス内で複数のパス情報をキャッシュ', () => {
      const ref1 = getStatePropertyRef(pathInfo1, listIndex1);
      const ref2 = getStatePropertyRef(pathInfo2, listIndex1);
      
      expect(ref1.listIndex).toBe(listIndex1);
      expect(ref2.listIndex).toBe(listIndex1);
      expect(ref1).not.toBe(ref2);
      
      // 再取得で同じインスタンスが返される
      expect(getStatePropertyRef(pathInfo1, listIndex1)).toBe(ref1);
      expect(getStatePropertyRef(pathInfo2, listIndex1)).toBe(ref2);
    });
  });

  describe('エッジケース', () => {
    it('同一のパス情報オブジェクトを使用した場合の一貫性', () => {
      const pathInfo = getStructuredPathInfo('test.path');
      
      const ref1 = getStatePropertyRef(pathInfo, null);
      const ref2 = getStatePropertyRef(pathInfo, null);
      const ref3 = getStatePropertyRef(pathInfo, listIndex1);
      const ref4 = getStatePropertyRef(pathInfo, listIndex1);
      
      expect(ref1).toBe(ref2);
      expect(ref3).toBe(ref4);
      expect(ref1).not.toBe(ref3);
    });

    it('複雑なパス構造での動作確認', () => {
      const complexPath = getStructuredPathInfo('root.*.items.*.nested.*.value');
      const ref = getStatePropertyRef(complexPath, listIndex1);
      
      expect(ref.info).toBe(complexPath);
      expect(ref.listIndex).toBe(listIndex1);
      expect(ref.key).toContain(complexPath.sid);
      expect(ref.key).toContain(listIndex1.sid);
    });

    it('空配列のリストインデックスでの動作', () => {
      const emptyListIndex = createListIndex(null, 0);
      const ref = getStatePropertyRef(pathInfo1, emptyListIndex);
      
      expect(ref.listIndex).toBe(emptyListIndex);
      expect(ref.key).toContain(emptyListIndex.sid);
    });

    it('大量の異なる組み合わせでのキャッシュ動作', () => {
      const paths = [
        getStructuredPathInfo('path1'),
        getStructuredPathInfo('path2'),
        getStructuredPathInfo('path3')
      ];
      const indices = [
        createListIndex(null, 0),
        createListIndex(null, 1),
        null
      ];
      
      const refs: IStatePropertyRef[][] = [];
      
      // 全組み合わせで作成
      for (let i = 0; i < paths.length; i++) {
        refs[i] = [];
        for (let j = 0; j < indices.length; j++) {
          refs[i][j] = getStatePropertyRef(paths[i], indices[j]);
        }
      }
      
      // 再取得で同じインスタンスが返されることを確認
      for (let i = 0; i < paths.length; i++) {
        for (let j = 0; j < indices.length; j++) {
          expect(getStatePropertyRef(paths[i], indices[j])).toBe(refs[i][j]);
        }
      }
    });
  });

  describe('parentRef', () => {
    it('親情報が無いトップレベルパスでは null を返す', () => {
      const rootInfo = getStructuredPathInfo('root');
      const rootRef = getStatePropertyRef(rootInfo, null);

      expect(rootRef.parentRef).toBeNull();
    });

    it('ワイルドカード数が同じ場合は現在の listIndex を引き継ぐ', () => {
      const parentInfo = getStructuredPathInfo('root.*');
      const childInfo = getStructuredPathInfo('root.*.value');
      const sharedIndex = createListIndex(null, 0);

      const childRef = getStatePropertyRef(childInfo, sharedIndex);
      const parentRef = childRef.parentRef;

      expect(parentRef).not.toBeNull();
      expect(parentRef?.info).toBe(parentInfo);
      expect(parentRef?.listIndex).toBe(sharedIndex);
    });

    it('listIndex が null の場合は null を親参照に渡す', () => {
      const parentInfo = getStructuredPathInfo('root');
      const childInfo = getStructuredPathInfo('root.child');

      const childRef = getStatePropertyRef(childInfo, null);
      const parentRef = childRef.parentRef;

      expect(parentRef).not.toBeNull();
      expect(parentRef?.info).toBe(parentInfo);
      expect(parentRef?.listIndex).toBeNull();
    });

    it('子のワイルドカードが親より深い場合は一つ上の listIndex を利用する', () => {
      const deepInfo = getStructuredPathInfo('root.*.items.*');
      const parentInfo = deepInfo.parentInfo!; // 'root.*.items'
      const outerIndex = createListIndex(null, 0);
      const innerIndex = createListIndex(outerIndex, 1);

      const deepRef = getStatePropertyRef(deepInfo, innerIndex);
      const parentRef = deepRef.parentRef;

      expect(parentRef).not.toBeNull();
      expect(parentRef?.info).toBe(parentInfo);
      expect(parentRef?.listIndex).toBe(outerIndex);
    });
  });

  describe('インターフェース適合性', () => {
    it('IStatePropertyRef インターフェースに適合している', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      // 必須プロパティの存在確認
      expect(ref.info).toBeDefined();
      expect(typeof ref.key).toBe('string');
      expect(ref.listIndex !== undefined).toBe(true); // nullでも良い
      
      // 型の確認
      expect(ref.info).toBe(pathInfo1);
      expect(ref.listIndex).toBe(listIndex1);
    });

    it('nullリストインデックスでも IStatePropertyRef に適合', () => {
      const ref = getStatePropertyRef(pathInfo1, null);
      
      expect(ref.info).toBe(pathInfo1);
      expect(ref.listIndex).toBeNull();
      expect(typeof ref.key).toBe('string');
    });
  });
});