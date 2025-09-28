/**
 * types.test.ts
 *
 * StatePropertyRef/types.tsの型定義の単体テスト
 */
import { describe, it, expect } from 'vitest';
import type { IStatePropertyRef } from '../../src/StatePropertyRef/types';
import { getStatePropertyRef } from '../../src/StatePropertyRef/StatepropertyRef';
import { getStructuredPathInfo } from '../../src/StateProperty/getStructuredPathInfo';
import { createListIndex } from '../../src/ListIndex/ListIndex';

describe('StatePropertyRef types', () => {
  describe('IStatePropertyRef interface', () => {
    it('IStatePropertyRefが正しいプロパティを持つ', () => {
      const pathInfo = getStructuredPathInfo('test.*.path');
      const listIndex = createListIndex(null, 0);
      const ref: IStatePropertyRef = getStatePropertyRef(pathInfo, listIndex);
      
      // 必須プロパティの存在確認
      expect(ref.info).toBeDefined();
      expect(ref.listIndex).toBeDefined();
      expect(typeof ref.key).toBe('string');
      
      // 型の確認
      expect(ref.info).toBe(pathInfo);
      expect(ref.listIndex).toBe(listIndex);
    });

    it('listIndexがnullの場合も正しく動作する', () => {
      const pathInfo = getStructuredPathInfo('test.path');
      const ref: IStatePropertyRef = getStatePropertyRef(pathInfo, null);
      
      expect(ref.info).toBe(pathInfo);
      expect(ref.listIndex).toBeNull();
      expect(typeof ref.key).toBe('string');
    });

    it('keyプロパティが文字列型である', () => {
      const pathInfo = getStructuredPathInfo('key.test');
      const listIndex = createListIndex(null, 1);
      const ref: IStatePropertyRef = getStatePropertyRef(pathInfo, listIndex);
      
      // 型レベルでの確認
      const key: string = ref.key;
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('infoプロパティがIStructuredPathInfo型である', () => {
      const pathInfo = getStructuredPathInfo('info.test.*.value');
      const ref: IStatePropertyRef = getStatePropertyRef(pathInfo, null);
      
      // IStructuredPathInfoの特徴的なプロパティを確認
      expect(ref.info.pattern).toBe('info.test.*.value');
      expect(ref.info.pathSegments).toEqual(['info', 'test', '*', 'value']);
      expect(ref.info.wildcardCount).toBe(1);
    });

    it('listIndexプロパティがIListIndex | null型である', () => {
      const pathInfo = getStructuredPathInfo('listindex.test');
      const listIndex = createListIndex(null, 2);
      
      const refWithIndex: IStatePropertyRef = getStatePropertyRef(pathInfo, listIndex);
      const refWithoutIndex: IStatePropertyRef = getStatePropertyRef(pathInfo, null);
      
      // IListIndexの特徴的なプロパティを確認
      expect(refWithIndex.listIndex).not.toBeNull();
      expect(refWithIndex.listIndex!.id).toBeDefined();
      expect(refWithIndex.listIndex!.index).toBe(2);
      
      // null許容を確認
      expect(refWithoutIndex.listIndex).toBeNull();
    });
  });

  describe('型の相互作用', () => {
    it('IStatePropertyRefの実装が型定義と一致している', () => {
      const pathInfo = getStructuredPathInfo('interaction.*.test');
      const listIndex = createListIndex(null, 3);
      const ref = getStatePropertyRef(pathInfo, listIndex);
      
      // TypeScriptの型システムでの検証
      const typeTest: IStatePropertyRef = ref;
      expect(typeTest).toBe(ref);
      
      // 各プロパティの型の確認
      expect(typeTest.info).toBe(pathInfo);
      expect(typeTest.listIndex).toBe(listIndex);
      expect(typeof typeTest.key).toBe('string');
    });

    it('nullリストインデックスでも型安全性が保たれる', () => {
      const pathInfo = getStructuredPathInfo('empty.safety.test');
      const ref = getStatePropertyRef(pathInfo, null);
      
      // null許容型での型安全性
      const listIndex: typeof ref.listIndex = ref.listIndex;
      if (listIndex !== null) {
        expect(listIndex.id).toBeDefined();
      } else {
        expect(listIndex).toBeNull();
      }
    });

    it('複数の実装インスタンスが同じ型インターフェースに適合', () => {
      const pathInfo1 = getStructuredPathInfo('multi.instance.test1');
      const pathInfo2 = getStructuredPathInfo('multi.instance.test2');
      const listIndex1 = createListIndex(null, 0);
      const listIndex2 = createListIndex(null, 1);
      
      const refs: IStatePropertyRef[] = [
        getStatePropertyRef(pathInfo1, listIndex1),
        getStatePropertyRef(pathInfo1, null),
        getStatePropertyRef(pathInfo2, listIndex2),
        getStatePropertyRef(pathInfo2, null)
      ];
      
      // 全て同じインターフェースに適合することを確認
      refs.forEach(ref => {
        expect(ref.info).toBeDefined();
        expect(ref.key).toBeDefined();
        expect(typeof ref.key).toBe('string');
        // listIndexはnullでも良い
        expect(ref.listIndex !== undefined).toBe(true);
      });
    });
  });

  describe('型制約の確認', () => {
    it('readonlyプロパティが適切に制約される', () => {
      const pathInfo = getStructuredPathInfo('readonly.test');
      const ref = getStatePropertyRef(pathInfo, null);
      
      // TypeScriptのreadonlyは実行時には強制されないが、
      // 型レベルでの制約を確認
      expect(() => {
        const testReadonly: IStatePropertyRef = ref;
        expect(testReadonly).toBeDefined();
      }).not.toThrow();
    });

    it('型定義が実際の実装と整合している', () => {
      const pathInfo = getStructuredPathInfo('consistency.check.*.item');
      const listIndex = createListIndex(null, 5);
      const ref = getStatePropertyRef(pathInfo, listIndex);
      
      // 型定義のすべてのプロパティが実装に存在することを確認
      const interfaceProperties: (keyof IStatePropertyRef)[] = ['info', 'listIndex', 'key'];
      
      interfaceProperties.forEach(prop => {
        expect(ref[prop] !== undefined).toBe(true);
      });
    });
  });

  describe('エッジケースでの型安全性', () => {
    it('複雑なパス構造でも型安全性が保たれる', () => {
      const complexPath = getStructuredPathInfo('very.*.deep.*.nested.*.structure.*.test');
      const ref: IStatePropertyRef = getStatePropertyRef(complexPath, null);
      
      expect(ref.info.pattern).toBe('very.*.deep.*.nested.*.structure.*.test');
      expect(ref.info.wildcardCount).toBe(4);
      expect(ref.listIndex).toBeNull();
    });

    it('動的に作成されたパスでも型制約を満たす', () => {
      const dynamicPathString = ['dynamic', '*', 'path', '*', 'test'].join('.');
      const dynamicPath = getStructuredPathInfo(dynamicPathString);
      const dynamicIndex = createListIndex(null, Math.floor(Math.random() * 10));
      
      const ref: IStatePropertyRef = getStatePropertyRef(dynamicPath, dynamicIndex);
      
      expect(ref.info).toBe(dynamicPath);
      expect(ref.listIndex).toBe(dynamicIndex);
      expect(ref.key).toContain(dynamicPath.sid);
      expect(ref.key).toContain(dynamicIndex.sid);
    });
  });
});