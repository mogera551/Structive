
/**
 * Router/types.ts
 *
 * SPAルーター用のインターフェース定義ファイルです。
 *
 * 主な役割:
 * - IRouter: ルーターの基本インターフェース
 *   - navigate: 指定したパスに遷移するためのメソッド
 *
 * 設計ポイント:
 * - ルーターの実装クラスが共通して持つべきAPIを型安全に定義
 */
export interface IRouter {
  navigate: (path: string) => void;
}