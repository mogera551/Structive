/**
 * getStructuredPathInfo.test.ts
 *
 * getStructuredPathInfo.tsの単体テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getStructuredPathInfo } from '../../src/StateProperty/getStructuredPathInfo';

describe('getStructuredPathInfo', () => {
  describe('基本的なパス解析', () => {
    it('単純なパス "aaa" を解析できる', () => {
      const info = getStructuredPathInfo('aaa');
      
      expect(info.pattern).toBe('aaa');
      expect(info.pathSegments).toEqual(['aaa']);
      expect(info.lastSegment).toBe('aaa');
      expect(info.cumulativePaths).toEqual(['aaa']);
      expect(info.wildcardCount).toBe(0);
      expect(info.wildcardPaths).toEqual([]);
      expect(info.parentPath).toBeNull();
      expect(info.parentInfo).toBeNull();
    });

    it('ネストしたパス "aaa.bbb.ccc" を解析できる', () => {
      const info = getStructuredPathInfo('aaa.bbb.ccc');
      
      expect(info.pattern).toBe('aaa.bbb.ccc');
      expect(info.pathSegments).toEqual(['aaa', 'bbb', 'ccc']);
      expect(info.lastSegment).toBe('ccc');
      expect(info.cumulativePaths).toEqual(['aaa', 'aaa.bbb', 'aaa.bbb.ccc']);
      expect(info.wildcardCount).toBe(0);
      expect(info.wildcardPaths).toEqual([]);
      expect(info.parentPath).toBe('aaa.bbb');
    });

    it('親子関係が正しく設定される', () => {
      const info = getStructuredPathInfo('aaa.bbb.ccc');
      
      expect(info.parentInfo).not.toBeNull();
      expect(info.parentInfo?.pattern).toBe('aaa.bbb');
      expect(info.parentInfo?.parentPath).toBe('aaa');
      expect(info.parentInfo?.parentInfo?.pattern).toBe('aaa');
      expect(info.parentInfo?.parentInfo?.parentPath).toBeNull();
    });
  });

  describe('ワイルドカードパス解析', () => {
    it('単一のワイルドカード "*" を解析できる', () => {
      const info = getStructuredPathInfo('*');
      
      expect(info.pattern).toBe('*');
      expect(info.pathSegments).toEqual(['*']);
      expect(info.lastSegment).toBe('*');
      expect(info.wildcardCount).toBe(1);
      expect(info.wildcardPaths).toEqual(['*']);
      expect(info.wildcardPathSet.has('*')).toBe(true);
    });

    it('ワイルドカードを含むパス "aaa.*.bbb" を解析できる', () => {
      const info = getStructuredPathInfo('aaa.*.bbb');
      
      expect(info.pattern).toBe('aaa.*.bbb');
      expect(info.pathSegments).toEqual(['aaa', '*', 'bbb']);
      expect(info.lastSegment).toBe('bbb');
      expect(info.cumulativePaths).toEqual(['aaa', 'aaa.*', 'aaa.*.bbb']);
      expect(info.wildcardCount).toBe(1);
      expect(info.wildcardPaths).toEqual(['aaa.*']);
      expect(info.lastWildcardPath).toBe('aaa.*');
    });

    it('複数のワイルドカードを含むパス "aaa.*.bbb.*.ccc" を解析できる', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.*.ccc');
      
      expect(info.pattern).toBe('aaa.*.bbb.*.ccc');
      expect(info.pathSegments).toEqual(['aaa', '*', 'bbb', '*', 'ccc']);
      expect(info.lastSegment).toBe('ccc');
      expect(info.cumulativePaths).toEqual([
        'aaa',
        'aaa.*',
        'aaa.*.bbb',
        'aaa.*.bbb.*',
        'aaa.*.bbb.*.ccc'
      ]);
      expect(info.wildcardCount).toBe(2);
      expect(info.wildcardPaths).toEqual(['aaa.*', 'aaa.*.bbb.*']);
      expect(info.lastWildcardPath).toBe('aaa.*.bbb.*');
    });

    it('ワイルドカードのインデックス情報が正しく設定される', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.*.ccc');
      
      expect(info.indexByWildcardPath).toEqual({
        'aaa.*': 0,
        'aaa.*.bbb.*': 1
      });
    });

    it('ワイルドカード親パス情報が正しく設定される', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.*.ccc');
      
      expect(info.wildcardParentPaths).toEqual(['aaa', 'aaa.*.bbb']);
      expect(info.wildcardParentPathSet.has('aaa')).toBe(true);
      expect(info.wildcardParentPathSet.has('aaa.*.bbb')).toBe(true);
    });
  });

  describe('Set と配列の整合性', () => {
    it('cumulativePathSet と cumulativePaths が一致している', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.ccc');
      
      expect(info.cumulativePathSet.size).toBe(info.cumulativePaths.length);
      for (const path of info.cumulativePaths) {
        expect(info.cumulativePathSet.has(path)).toBe(true);
      }
    });

    it('wildcardPathSet と wildcardPaths が一致している', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.*.ccc');
      
      expect(info.wildcardPathSet.size).toBe(info.wildcardPaths.length);
      for (const path of info.wildcardPaths) {
        expect(info.wildcardPathSet.has(path)).toBe(true);
      }
    });

    it('cumulativeInfoSet と cumulativeInfos が一致している', () => {
      const info = getStructuredPathInfo('aaa.bbb.ccc');
      
      expect(info.cumulativeInfoSet.size).toBe(info.cumulativeInfos.length);
      for (const infoItem of info.cumulativeInfos) {
        expect(info.cumulativeInfoSet.has(infoItem)).toBe(true);
      }
    });

    it('wildcardInfoSet と wildcardInfos が一致している', () => {
      const info = getStructuredPathInfo('aaa.*.bbb.*');
      
      expect(info.wildcardInfoSet.size).toBe(info.wildcardInfos.length);
      for (const infoItem of info.wildcardInfos) {
        expect(info.wildcardInfoSet.has(infoItem)).toBe(true);
      }
    });
  });

  describe('キャッシュ機能', () => {
    it('同じパスで複数回呼び出すと同じインスタンスを返す', () => {
      const info1 = getStructuredPathInfo('test.path');
      const info2 = getStructuredPathInfo('test.path');
      
      expect(info1).toBe(info2);
    });

    it('異なるパスでは異なるインスタンスを返す', () => {
      const info1 = getStructuredPathInfo('test.path1');
      const info2 = getStructuredPathInfo('test.path2');
      
      expect(info1).not.toBe(info2);
    });

    it('予約語チェックはキャッシュより先に実行される', () => {
      // 予約語は毎回エラーが発生する（キャッシュされない）
      expect(() => {
        getStructuredPathInfo('toString');
  }).toThrow('Pattern is reserved word: toString');
      
      expect(() => {
        getStructuredPathInfo('toString');
  }).toThrow('Pattern is reserved word: toString');
    });
  });

  describe('エラーハンドリング', () => {
    it('予約語を使用した場合にエラーが発生する', () => {
      // constructorは予約語として定義されているため、エラーが発生する
      expect(() => {
        getStructuredPathInfo('constructor');
  }).toThrow('Pattern is reserved word: constructor');
      
      // 他の予約語でもテスト
      expect(() => {
        getStructuredPathInfo('prototype');
  }).toThrow('Pattern is reserved word: prototype');
    });

    it('一般的なプロパティ名では正常に動作する', () => {
      // 通常のプロパティ名は正常に動作する
      const result = getStructuredPathInfo('normalProperty');
      expect(result).toBeDefined();
      expect(result.pathSegments).toEqual(['normalProperty']);
      expect(result.lastSegment).toBe('normalProperty');
      
      // 他の一般的な名前でもテスト
      const result2 = getStructuredPathInfo('myData');
      expect(result2).toBeDefined();
      expect(result2.pathSegments).toEqual(['myData']);
      expect(result2.lastSegment).toBe('myData');
    });
  });

  describe('IDとsid', () => {
    it('各インスタンスが一意のIDを持つ', () => {
      const info1 = getStructuredPathInfo('path1');
      const info2 = getStructuredPathInfo('path2');
      
      expect(info1.id).not.toBe(info2.id);
      expect(info1.sid).toBe(info1.id.toString());
      expect(info2.sid).toBe(info2.id.toString());
    });

    it('IDが正の整数である', () => {
      const info = getStructuredPathInfo('test.path');
      
      expect(info.id).toBeGreaterThan(0);
      expect(Number.isInteger(info.id)).toBe(true);
    });
  });

  describe('childrenプロパティ', () => {
    it('親子関係が children プロパティに反映される', () => {
      const parentInfo = getStructuredPathInfo('parent');
      const childInfo = getStructuredPathInfo('parent.child');
      
      expect(parentInfo.children['child']).toBe(childInfo);
    });

    it('複数の子が正しく管理される', () => {
      const parentInfo = getStructuredPathInfo('parent');
      const child1Info = getStructuredPathInfo('parent.child1');
      const child2Info = getStructuredPathInfo('parent.child2');
      
      expect(parentInfo.children['child1']).toBe(child1Info);
      expect(parentInfo.children['child2']).toBe(child2Info);
      expect(Object.keys(parentInfo.children)).toContain('child1');
      expect(Object.keys(parentInfo.children)).toContain('child2');
    });
  });

  describe('エッジケース', () => {
    it('空文字列を渡した場合の動作', () => {
      const info = getStructuredPathInfo('');
      
      expect(info.pattern).toBe('');
      expect(info.pathSegments).toEqual(['']);
      expect(info.lastSegment).toBe('');
      expect(info.cumulativePaths).toEqual(['']);
      expect(info.wildcardCount).toBe(0);
    });

    it('ワイルドカードのみのパス "*.*.*" を解析できる', () => {
      const info = getStructuredPathInfo('*.*.*');
      
      expect(info.pattern).toBe('*.*.*');
      expect(info.pathSegments).toEqual(['*', '*', '*']);
      expect(info.wildcardCount).toBe(3);
      expect(info.wildcardPaths).toEqual(['*', '*.*', '*.*.*']);
    });
  });
});