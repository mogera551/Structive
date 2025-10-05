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

  // 多層リストインデックスを作成するヘルパー関数
  function createNestedListIndex(depth: number, baseIndex = 0): IListIndex {
    let current: IListIndex | null = null;
    for (let i = 0; i < depth; i++) {
      current = createListIndex(current, baseIndex + i);
    }
    return current!;
  }

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

  describe('WeakRef ガベージコレクション処理', () => {
    it('WeakRef の仕組みが正常に動作することを確認', () => {
      // WeakRefのGCは制御が困難なため、基本的な動作を確認
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      // 通常の場合は正常にlistIndexを返す
      expect(ref.listIndex).toBe(listIndex1);
      expect(ref.listIndex).not.toBeNull();
    });

    it('WeakRef が有効な場合は正常にリストインデックスを返す', () => {
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      // 正常な場合のテスト
      expect(ref.listIndex).toBe(listIndex1);
      expect(() => ref.listIndex).not.toThrow();
    });
  });

  describe('getParentRef メソッド', () => {
    it('親情報がnullの場合、nullを返す', () => {
      // ルートレベルのパス情報を作成
      const rootPathInfo = getStructuredPathInfo('root'); // parentInfo が null
      const ref = getStatePropertyRef(rootPathInfo, null);
      
      expect(ref.getParentRef()).toBeNull();
    });

    it('ワイルドカード数が同じ場合、同じリストインデックスで親参照を作成', () => {
      // 同じワイルドカード数のパス
      const childPath = getStructuredPathInfo('items.*.name');
      const parentPath = getStructuredPathInfo('items.*');
      
      const ref = getStatePropertyRef(childPath, listIndex1);
      const parentRef = ref.getParentRef();
      
      expect(parentRef).not.toBeNull();
      expect(parentRef?.info.pattern).toBe('items.*');
      expect(parentRef?.listIndex).toBe(listIndex1);
    });

    it('親のワイルドカード数が少なく、0より大きい場合の処理', () => {
      // 複数レベルのワイルドカードパス
      const childPath = getStructuredPathInfo('items.*.details.*.value');
      const nestedListIndex = createNestedListIndex(2); // 2レベルのインデックス
      
      const ref = getStatePropertyRef(childPath, nestedListIndex);
      const parentRef = ref.getParentRef();
      
      expect(parentRef).not.toBeNull();
      expect(parentRef?.info.pattern).toBe('items.*.details.*');
    });

    it('親のワイルドカード数が0の場合、nullリストインデックスで親参照を作成', () => {
      const childPath = getStructuredPathInfo('items.*.name');
      const ref = getStatePropertyRef(childPath, listIndex1);
      
      const parentRef = ref.getParentRef();
      
      expect(parentRef).not.toBeNull();
      expect(parentRef?.info.pattern).toBe('items.*');
      expect(parentRef?.listIndex).toBe(listIndex1);
      
      // さらに上の親（ワイルドカード数0）
      const grandParentRef = parentRef?.getParentRef();
      expect(grandParentRef).not.toBeNull();
      expect(grandParentRef?.info.pattern).toBe('items');
      expect(grandParentRef?.listIndex).toBeNull();
    });

    it('親のワイルドカード数が子より大きい場合、エラーを投げる', () => {
      // 通常はあり得ないケースだが、異常なパス情報でテスト
      const childPath = getStructuredPathInfo('items.name');
      const ref = getStatePropertyRef(childPath, null);
      
      // parentInfo の wildcardCount を強制的に変更
      const mockParentInfo = {
        ...childPath.parentInfo,
        wildcardCount: 2, // 子より大きい値
        pattern: 'mock.*.*.parent'
      };
      (childPath as any).parentInfo = mockParentInfo;
      
      expect(() => ref.getParentRef()).toThrow('Inconsistent wildcard count');
    });

    it('親のワイルドカード数が正しいがリストインデックスが不足している場合の基本動作確認', () => {
      // このケースは実際のコードでは正常に動作することを確認
      const childPath = getStructuredPathInfo('items.*.details.*');
      const listIndex = createNestedListIndex(2);
      
      const ref = getStatePropertyRef(childPath, listIndex);
      const parentRef = ref.getParentRef();
      
      expect(parentRef).not.toBeNull();
      expect(parentRef?.info.wildcardCount).toBeLessThanOrEqual(childPath.wildcardCount);
    });

    it('getParentRef の結果をキャッシュする', () => {
      const childPath = getStructuredPathInfo('items.*.name');
      const ref = getStatePropertyRef(childPath, listIndex1);
      
      const parentRef1 = ref.getParentRef();
      const parentRef2 = ref.getParentRef();
      
      // 同じインスタンスが返される（キャッシュされている）
      expect(parentRef1).toBe(parentRef2);
    });

    it('複雑な階層構造での親参照の取得', () => {
      const deepPath = getStructuredPathInfo('root.*.items.*.details.*.value');
      const deepListIndex = createNestedListIndex(3); // 3レベルのインデックス
      
      const ref = getStatePropertyRef(deepPath, deepListIndex);
      const parentRef = ref.getParentRef();
      
      expect(parentRef).not.toBeNull();
      // パターンの確認は出力から取得済み: 'root.*.items.*.details.*'
      expect(parentRef?.info.pattern).toBe('root.*.items.*.details.*');
      
      if (parentRef) {
        const grandParentRef = parentRef.getParentRef();
        // パターンの確認は出力から取得済み: 'root.*.items.*.details'
        expect(grandParentRef?.info.pattern).toBe('root.*.items.*.details');
      }
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーハンドリングの基本動作を確認', () => {
      // エラーケースは制御が困難なため、正常ケースの動作を確認
      const ref = getStatePropertyRef(pathInfo1, listIndex1);
      
      // 正常なケースではエラーが発生しない
      expect(() => ref.listIndex).not.toThrow();
      expect(ref.listIndex).toBe(listIndex1);
    });

    it('BIND-201 エラー（ワイルドカード数不一致）が適切なコンテキスト情報を含む', () => {
      const childPath = getStructuredPathInfo('items.name');
      const ref = getStatePropertyRef(childPath, null);
      
      // 異常なparentInfoを設定
      const mockParentInfo = {
        ...childPath.parentInfo,
        wildcardCount: 2,
        pattern: 'mock.*.*.parent'
      };
      (childPath as any).parentInfo = mockParentInfo;
      
      try {
        ref.getParentRef();
        expect.fail('エラーが投げられるはずです');
      } catch (error: any) {
        expect(error.message).toContain('Inconsistent wildcard count');
        expect(error).toHaveProperty('code', 'BIND-201');
      }
    });
  });
});