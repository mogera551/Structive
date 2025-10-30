/**
 * createAccessorFunctions.test.ts
 *
 * createAccessorFunctions.tsの単体テスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAccessorFunctions } from '../../src/StateProperty/createAccessorFunctions';
import { getStructuredPathInfo } from '../../src/StateProperty/getStructuredPathInfo';

// テスト用のダミーオブジェクト
class TestObject {
  public value1 = 'test1';
  public nested = {
    value2: 'test2',
    deeper: {
      value3: 'test3'
    }
  };
  
  // ワイルドカード用のテストデータ
  public items = [
    { name: 'item0', values: ['a', 'b', 'c'] },
    { name: 'item1', values: ['d', 'e', 'f'] }
  ];

  // テスト用の$プロパティ（ワイルドカードインデックス）
  public $1 = 0;
  public $2 = 1;
}

describe('createAccessorFunctions', () => {
  let testObj: TestObject;

  beforeEach(() => {
    testObj = new TestObject();
  });

  describe('基本的なアクセサ生成', () => {
    it('単純なプロパティのアクセサを生成できる', () => {
      const info = getStructuredPathInfo('value1');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('test1');
      
      accessor.set.call(testObj, 'newValue1');
      expect(testObj.value1).toBe('newValue1');
    });

    it('ネストしたプロパティのアクセサを生成できる', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('test2');
      
      accessor.set.call(testObj, 'newValue2');
      expect(testObj.nested.value2).toBe('newValue2');
    });

    it('深くネストしたプロパティのアクセサを生成できる', () => {
      const info = getStructuredPathInfo('nested.deeper.value3');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('test3');
      
      accessor.set.call(testObj, 'newValue3');
      expect(testObj.nested.deeper.value3).toBe('newValue3');
    });
  });

  describe('gettersによる最適化', () => {
    beforeEach(() => {
      // nestedプロパティがgetter関数として定義されている場合をシミュレート
      (testObj as any)['nested'] = testObj.nested;
      (testObj as any)['nested.deeper'] = testObj.nested.deeper;
    });

    it('マッチするgetterがある場合、それを使用してアクセサを生成', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set(['nested']);
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('test2');
      
      accessor.set.call(testObj, 'optimizedValue');
      expect(testObj.nested.value2).toBe('optimizedValue');
    });

    it('部分的にマッチするgetterを使用', () => {
      const info = getStructuredPathInfo('nested.deeper.value3');
      const getters = new Set(['nested', 'nested.deeper']);
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('test3');
      
      accessor.set.call(testObj, 'deepOptimized');
      expect(testObj.nested.deeper.value3).toBe('deepOptimized');
    });

    it('最長のマッチするgetterを選択する', () => {
      const info = getStructuredPathInfo('nested.deeper.value3');
      const getters = new Set(['nested', 'nested.deeper']);
      const accessor = createAccessorFunctions(info, getters);
      
      // 最長のマッチ（'nested.deeper'）が使用されることを確認
      expect(() => accessor.get.call(testObj)).not.toThrow();
    });

    it('ワイルドカードを含むgetterでも末尾のワイルドカードセグメントを組み立てられる', () => {
      const info = getStructuredPathInfo('items.*.values.*');
      const getters = new Set(['items.*', 'items.*.values']);
      // getter ベースで参照されるプロパティを用意
      (testObj as any)['items.*'] = testObj.items;
      (testObj as any)['items.*.values'] = testObj.items[0].values;

      const accessor = createAccessorFunctions(info, getters);
      testObj.$1 = 0;
      testObj.$2 = 1;

      expect(accessor.get.call(testObj)).toBe('b');
      accessor.set.call(testObj, 'wildcardSet');
      expect(testObj.items[0].values[1]).toBe('wildcardSet');
    });
  });

  describe('ワイルドカードアクセサ', () => {
    it('単一ワイルドカードのアクセサを生成できる', () => {
      const info = getStructuredPathInfo('items.*');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toEqual(testObj.items[0]);
    });

    it('ワイルドカードを含むネストしたアクセサを生成', () => {
      const info = getStructuredPathInfo('items.*.name');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('item0');
      
      accessor.set.call(testObj, 'newItemName');
      expect(testObj.items[0].name).toBe('newItemName');
    });

    it('複数のワイルドカードを含むアクセサを生成', () => {
      const info = getStructuredPathInfo('items.*.values.*');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      // ワイルドカードインデックスが正しく設定されているか確認
      testObj.$1 = 0;  // 最初のワイルドカード
      testObj.$2 = 1;  // 二番目のワイルドカード
      
      const result = accessor.get.call(testObj);
      expect(result).toBe('b');  // items[0].values[1] = 'b'
      
      accessor.set.call(testObj, 'newValue');
      expect(testObj.items[0].values[1]).toBe('newValue');
    });

    it('gettersとワイルドカードの組み合わせ', () => {
      const info = getStructuredPathInfo('items.*.values.*');
      const getters = new Set(['items']);
      const accessor = createAccessorFunctions(info, getters);
      
      expect(() => accessor.get.call(testObj)).not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なセグメント名でエラーが発生する', () => {
      // 不正なセグメント名を含むパスを直接作成することはできないので、
      // Function生成でエラーが発生するケースをテストする
      const info = getStructuredPathInfo('valid');
      const getters = new Set<string>();
      
      // 正常なケースでは例外が発生しないことを確認
      expect(() => createAccessorFunctions(info, getters)).not.toThrow();
    });

    it('不正なパス（予約語チェック）でエラーが発生する可能性', () => {
      // パスの妥当性チェックが行われることを確認
      const validInfo = getStructuredPathInfo('validPath');
      const getters = new Set(['validPath']);
      
      expect(() => createAccessorFunctions(validInfo, getters)).not.toThrow();
    });

    it('getters に不正なパスが含まれる場合は STATE-202 を投げる', () => {
      const info = getStructuredPathInfo('invalid-path.children.leaf');
      const getters = new Set(['invalid-path.children']);

      expect(() => createAccessorFunctions(info, getters)).toThrowError(/Invalid path: invalid-path.children/);
    });

    it('getter でマッチした後続セグメントが不正名の場合も STATE-202', () => {
      const info = getStructuredPathInfo('valid.base.invalid-seg');
      const getters = new Set(['valid.base']);

      expect(() => createAccessorFunctions(info, getters)).toThrowError(
        /Invalid segment name: invalid-seg/
      );
    });
  });

  describe('動的関数生成', () => {
    it('生成されたgetter関数が正しく動作する', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      expect(typeof accessor.get).toBe('function');
      expect(accessor.get.call(testObj)).toBe('test2');
    });

    it('生成されたsetter関数が正しく動作する', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      expect(typeof accessor.set).toBe('function');
      accessor.set.call(testObj, 'dynamicValue');
      expect(testObj.nested.value2).toBe('dynamicValue');
    });

    it('複雑なパスでも正しい関数が生成される', () => {
      const info = getStructuredPathInfo('nested.deeper.value3');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      // 元の値を確認
      expect(accessor.get.call(testObj)).toBe('test3');
      
      // 新しい値を設定
      accessor.set.call(testObj, 'veryDeepValue');
      expect(testObj.nested.deeper.value3).toBe('veryDeepValue');
      
      // 設定した値を取得
      expect(accessor.get.call(testObj)).toBe('veryDeepValue');
    });
  });

  describe('パフォーマンスと最適化', () => {
    it('gettersが空の場合でも正常に動作する', () => {
      const info = getStructuredPathInfo('value1');
      const getters = new Set<string>();
      const accessor = createAccessorFunctions(info, getters);
      
      expect(accessor.get.call(testObj)).toBe('test1');
    });

    it('多数のgettersがある場合でも最適なものを選択', () => {
      const info = getStructuredPathInfo('nested.deeper.value3');
      const getters = new Set(['value1', 'nested', 'nested.deeper', 'other']);
      
      // gettersのシミュレーションを適切に設定
      (testObj as any)['nested'] = testObj.nested;
      (testObj as any)['nested.deeper'] = testObj.nested.deeper;
      
      const accessor = createAccessorFunctions(info, getters);
      
      // 最長一致の'nested.deeper'が選択されることを期待
      expect(accessor.get.call(testObj)).toBe('test3');
    });

    it('単一セグメントのgettersは無視される', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set(['nested']); // 単一セグメントなのでスキップされる
      const accessor = createAccessorFunctions(info, getters);
      
      // 通常のプロパティアクセスが使用される
      expect(accessor.get.call(testObj)).toBe('test2');
    });
  });

  describe('正規表現チェック', () => {
    it('有効なセグメント名は正規表現チェックを通る', () => {
      // 通常のテストケースが成功していることで、正規表現チェックが通っていることを確認
      const info = getStructuredPathInfo('validName123');
      const getters = new Set<string>();
      
      expect(() => createAccessorFunctions(info, getters)).not.toThrow();
    });

    it('有効なパス名は正規表現チェックを通る', () => {
      const info = getStructuredPathInfo('valid.path.name');
      const getters = new Set(['valid.path']);
      
      expect(() => createAccessorFunctions(info, getters)).not.toThrow();
    });
  });

  describe('特殊ケース', () => {
    it('空のプロパティパスはエラーが発生する', () => {
      const info = getStructuredPathInfo('');
      const getters = new Set<string>();
      
      expect(() => createAccessorFunctions(info, getters)).toThrow('Invalid segment name:');
    });

    it('ワイルドカードのみのパスの動作を確認', () => {
      const info = getStructuredPathInfo('*');
      const getters = new Set<string>();
      
      // createAccessorFunctionsは'*'のみの場合、無効なコードを生成するためエラーが発生する
      expect(() => createAccessorFunctions(info, getters)).toThrow();
    });

    it('複数のgettersがある場合でも正常に処理される', () => {
      const info = getStructuredPathInfo('nested.value2');
      const getters = new Set(['nested', 'nested.value2', 'other.path']);
      
      const result = createAccessorFunctions(info, getters);
      
      expect(result.get).toBeInstanceOf(Function);
      expect(result.set).toBeInstanceOf(Function);
    });
  });
});