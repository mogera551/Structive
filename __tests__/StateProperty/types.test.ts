/**
 * types.test.ts
 *
 * types.tsの型定義の単体テスト
 * TypeScriptの型定義そのものをテストし、インターフェースの整合性を確認
 */
import { describe, it, expect } from 'vitest';
import type { 
  IStructuredPathInfo, 
  IResolvedPathInfo, 
  IAccessorFunctions, 
  WildcardType, 
  Index, 
  Indexes 
} from '../../src/StateProperty/types';
import { getStructuredPathInfo } from '../../src/StateProperty/getStructuredPathInfo';
import { getResolvedPathInfo } from '../../src/StateProperty/getResolvedPathInfo';
import { createAccessorFunctions } from '../../src/StateProperty/createAccessorFunctions';

describe('StateProperty types', () => {
  describe('WildcardType', () => {
    it('WildcardTypeが正しい値を持つ', () => {
      const wildcardTypes: WildcardType[] = ['none', 'context', 'partial', 'all'];
      
      // 型レベルでのチェック（コンパイル時）
      const noneType: WildcardType = 'none';
      const contextType: WildcardType = 'context';
      const partialType: WildcardType = 'partial';
      const allType: WildcardType = 'all';
      
      expect(wildcardTypes).toContain(noneType);
      expect(wildcardTypes).toContain(contextType);
      expect(wildcardTypes).toContain(partialType);
      expect(wildcardTypes).toContain(allType);
    });
  });

  describe('Index and Indexes types', () => {
    it('Index型が正しく動作する', () => {
      const index1: Index = 0;
      const index2: Index = 123;
      const index3: Index = undefined;
      
      expect(typeof index1).toBe('number');
      expect(typeof index2).toBe('number');
      expect(index3).toBeUndefined();
    });

    it('Indexes型が正しく動作する', () => {
      const indexes1: Indexes = [];
      const indexes2: Indexes = [0, 1, 2];
      const indexes3: Indexes = [undefined, 0, undefined, 1];
      
      expect(Array.isArray(indexes1)).toBe(true);
      expect(Array.isArray(indexes2)).toBe(true);
      expect(Array.isArray(indexes3)).toBe(true);
    });
  });

  describe('IStructuredPathInfo interface', () => {
    it('IStructuredPathInfoが正しいプロパティを持つ', () => {
      const info: IStructuredPathInfo = getStructuredPathInfo('aaa.*.bbb');
      
      // 必須プロパティの存在確認
      expect(typeof info.id).toBe('number');
      expect(typeof info.sid).toBe('string');
      expect(Array.isArray(info.pathSegments)).toBe(true);
      expect(typeof info.lastSegment).toBe('string');
      expect(Array.isArray(info.cumulativePaths)).toBe(true);
      expect(info.cumulativePathSet instanceof Set).toBe(true);
      expect(Array.isArray(info.cumulativeInfos)).toBe(true);
      expect(info.cumulativeInfoSet instanceof Set).toBe(true);
      expect(typeof info.pattern).toBe('string');
      expect(typeof info.wildcardCount).toBe('number');
      expect(Array.isArray(info.wildcardPaths)).toBe(true);
      expect(info.wildcardPathSet instanceof Set).toBe(true);
      expect(Array.isArray(info.wildcardInfos)).toBe(true);
      expect(info.wildcardInfoSet instanceof Set).toBe(true);
      expect(typeof info.children).toBe('object');
    });

    it('readonlyプロパティが適切に設定される', () => {
      const info = getStructuredPathInfo('test.path');
      
      // readonlyプロパティは実行時には変更可能だが、型レベルで保護されている
      expect(() => {
        // このテストは主に型レベルでのチェック用
        const readonlyTest: IStructuredPathInfo = info;
        expect(readonlyTest).toBeDefined();
      }).not.toThrow();
    });

    it('親子関係のプロパティが正しく型定義されている', () => {
      const parentInfo = getStructuredPathInfo('parent');
      const childInfo = getStructuredPathInfo('parent.child');
      
      expect(childInfo.parentPath).toBe('parent');
      expect(childInfo.parentInfo).toBe(parentInfo);
      expect(parentInfo.parentPath).toBeNull();
      expect(parentInfo.parentInfo).toBeNull();
    });
  });

  describe('IResolvedPathInfo interface', () => {
    it('IResolvedPathInfoが正しいプロパティを持つ', () => {
      const info: IResolvedPathInfo = getResolvedPathInfo('aaa.0.bbb');
      
      expect(typeof info.id).toBe('number');
      expect(typeof info.name).toBe('string');
      expect(Array.isArray(info.elements)).toBe(true);
      expect(Array.isArray(info.paths)).toBe(true);
      expect(['none', 'context', 'partial', 'all'].includes(info.wildcardType)).toBe(true);
      expect(Array.isArray(info.wildcardIndexes)).toBe(true);
      expect(typeof info.info).toBe('object');
    });

    it('wildcardIndexesの型が正しい', () => {
      const info1 = getResolvedPathInfo('aaa.*.bbb');
      const info2 = getResolvedPathInfo('aaa.0.bbb');
      const info3 = getResolvedPathInfo('aaa.*.bbb.0');
      
      // null値を含む配列
      expect(info1.wildcardIndexes[0]).toBeNull();
      
      // 数値を含む配列
      expect(info2.wildcardIndexes[0]).toBe(0);
      
      // 混在する配列
      expect(info3.wildcardIndexes[0]).toBeNull();
      expect(info3.wildcardIndexes[1]).toBe(0);
    });
  });

  describe('IAccessorFunctions interface', () => {
    it('IAccessorFunctionsが正しいメソッドシグネチャを持つ', () => {
      const info = getStructuredPathInfo('test.property');
      const accessor: IAccessorFunctions = createAccessorFunctions(info, new Set());
      
      expect(typeof accessor.get).toBe('function');
      expect(typeof accessor.set).toBe('function');
      
      // 関数のシグネチャテスト（型レベル）
      const getValue: () => any = accessor.get;
      const setValue: (value: any) => void = accessor.set;
      
      expect(getValue).toBeDefined();
      expect(setValue).toBeDefined();
    });

    it('アクセサ関数が正しい型で動作する', () => {
      const testObj = { value: 'test' };
      const info = getStructuredPathInfo('value');
      const accessor = createAccessorFunctions(info, new Set());
      
      // getter関数のテスト
      const result: any = accessor.get.call(testObj);
      expect(result).toBe('test');
      
      // setter関数のテスト
      accessor.set.call(testObj, 'newValue');
      expect(testObj.value).toBe('newValue');
    });
  });

  describe('型の相互作用', () => {
    it('IStructuredPathInfoとIResolvedPathInfoが適切に連携する', () => {
      const resolvedInfo = getResolvedPathInfo('aaa.*.bbb.0');
      const structuredInfo: IStructuredPathInfo = resolvedInfo.info;
      
      expect(structuredInfo.pattern).toBe('aaa.*.bbb.*');
      expect(structuredInfo.wildcardCount).toBe(2);
      expect(resolvedInfo.wildcardType).toBe('partial');
    });

    it('IAccessorFunctionsとIStructuredPathInfoが適切に連携する', () => {
      const structuredInfo: IStructuredPathInfo = getStructuredPathInfo('nested.property');
      const accessor: IAccessorFunctions = createAccessorFunctions(structuredInfo, new Set());
      
      expect(accessor).toBeDefined();
      expect(typeof accessor.get).toBe('function');
      expect(typeof accessor.set).toBe('function');
    });
  });

  describe('型の制約とバリデーション', () => {
    it('readonlyプロパティが適切に制約される', () => {
      const info = getStructuredPathInfo('test');
      
      // TypeScriptのreadonlyは実行時には強制されないが、
      // 型レベルでの制約を確認
      expect(() => {
        const testReadonly: IStructuredPathInfo = info;
        // 以下はコンパイル時にエラーになるべき（型レベルのテスト）
        // testReadonly.id = 999; // TypeScriptエラー
        expect(testReadonly).toBeDefined();
      }).not.toThrow();
    });

    it('WildcardType制約が正しく機能する', () => {
      const info1 = getResolvedPathInfo('normal.path');
      const info2 = getResolvedPathInfo('path.*');
      const info3 = getResolvedPathInfo('path.0');
      const info4 = getResolvedPathInfo('path.*.item.0');
      
      expect(info1.wildcardType).toBe('none');
      expect(info2.wildcardType).toBe('context');
      expect(info3.wildcardType).toBe('all');
      expect(info4.wildcardType).toBe('partial');
    });
  });

  describe('複合型のテスト', () => {
    it('childrenプロパティの型が正しく動作する', () => {
      const parentInfo = getStructuredPathInfo('parent');
      const childInfo = getStructuredPathInfo('parent.child');
      
      const children: {[segment: string]: IStructuredPathInfo} = parentInfo.children;
      const child: IStructuredPathInfo = children['child'];
      
      expect(child).toBe(childInfo);
    });

    it('Set型プロパティが正しく動作する', () => {
      const info = getStructuredPathInfo('aaa.*.bbb');
      
      const pathSet: Set<string> = info.cumulativePathSet;
      const infoSet: Set<IStructuredPathInfo> = info.cumulativeInfoSet;
      const wildcardSet: Set<string> = info.wildcardPathSet;
      
      expect(pathSet instanceof Set).toBe(true);
      expect(infoSet instanceof Set).toBe(true);
      expect(wildcardSet instanceof Set).toBe(true);
    });
  });
});