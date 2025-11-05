/**
 * types.ts
 *
 * StateProperty関連の型定義ファイルです。
 *
 * 主な役割:
 * - Stateプロパティのパス情報やワイルドカード情報、アクセサ関数などの型を定義
 * - IStructuredPathInfo: パスの階層・ワイルドカード・親子関係など詳細な構造化情報
 * - IResolvedPathInfo: 実際のパス文字列や要素配列、ワイルドカード種別・インデックス情報
 * - IAccessorFunctions: 動的に生成されるgetter/setter関数の型
 *
 * 設計ポイント:
 * - パスの階層構造やワイルドカード階層を厳密に型で表現し、型安全なバインディングやアクセスを実現
 * - context/all/partial/noneなどワイルドカード種別も型で明示
 * - アクセサ関数の型定義で、動的なgetter/setter生成にも対応
 */
export interface IStructuredPathInfo {
  readonly id: number;
  readonly sid: string; // Unique ID as a string
  /** 
   * ex. aaa.\*.bbb.\*.ccc => ["aaa", "\*", "bbb", "\*", "ccc"]
   */
  readonly pathSegments: string[];
  readonly lastSegment: string;
  /** 
   * ex. aaa.\*.bbb.\*.ccc => [
   *   "aaa",
   *   "aaa.\*",
   *   "aaa.\*.bbb",
   *   "aaa.\*.bbb.\*",
   *   "aaa.\*.bbb.\*.ccc"
   * ]
   */
  readonly cumulativePaths: string[];
  readonly cumulativePathSet: Set<string>;
  readonly cumulativeInfos: IStructuredPathInfo[];
  readonly cumulativeInfoSet: Set<IStructuredPathInfo>;
  /** 
   * ex. aaa.\*.bbb.\*.ccc => "aaa.\*.bbb.\*"
   */
  readonly parentPath:string | null;
  readonly parentInfo: IStructuredPathInfo | null;
  /**
   * ex. aaa.\*.bbb.\*.ccc => [
   *   "aaa.\*",
   *   "aaa.\*.bbb.\*"
   * ]
   */
  readonly wildcardPaths: string[];
  readonly wildcardPathSet: Set<string>;
  readonly indexByWildcardPath: Record<string, number>;
  readonly wildcardInfos: IStructuredPathInfo[];
  readonly wildcardInfoSet: Set<IStructuredPathInfo>;
  readonly wildcardParentPaths: string[];
  readonly wildcardParentPathSet: Set<string>;
  readonly wildcardParentInfos: IStructuredPathInfo[];
  readonly wildcardParentInfoSet: Set<IStructuredPathInfo>;
  readonly lastWildcardPath: string | null;
  readonly lastWildcardInfo: IStructuredPathInfo | null;
  /**
   * ex. aaa.*.bbb.*.ccc
   */
  readonly pattern: string;
  readonly wildcardCount: number;
  readonly children: {[segment:string]: IStructuredPathInfo};
}

export type WildcardType = "none" | "context" | "partial" | "all";

export interface IResolvedPathInfo {
  readonly id: number;
  /**
   * ex. aaa.0.bbb.2.ccc => aaa.0.bbb.2.ccc
   */
  readonly name: string; // The original name
  /** 
   * ex. aaa.0.bbb.2.ccc => ["aaa", "0", "bbb", "2", "ccc"]
   */
  readonly elements: string[];
  /** 
   * ex. aaa.0.bbb.2.ccc => [
   *   "aaa",
   *   "aaa.0",
   *   "aaa.0.bbb",
   *   "aaa.0.bbb.2",
   *   "aaa.0.bbb.2.ccc"
   * ]
   */
  readonly paths: string[];
  readonly wildcardType: WildcardType;
  readonly wildcardIndexes: (number | null)[];
  readonly info: IStructuredPathInfo;
}

export interface IAccessorFunctions {
  get: () => any;
  set: (value: any) => void;
}