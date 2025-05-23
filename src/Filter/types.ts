/**
 * Filter/types.ts
 *
 * フィルタ関数に関する型定義ファイルです。
 *
 * 主な役割:
 * - フィルタ関数（FilterFn）や、オプション付きフィルタ関数（FilterWithOptionsFn）の型を定義
 * - フィルタ名と関数のマッピング（FilterWithOptions）や、フィルタ関数配列（Filters）を型安全に管理
 * - 組み込みフィルタ群からフィルタ関数を取得するための型も定義
 *
 * 設計ポイント:
 * - 柔軟なフィルタ設計・拡張を可能にするための型設計
 * - オプション付きフィルタや複数フィルタの組み合わせにも対応
 */
export type FilterFn = (value:any) => any;

export type FilterWithOptionsFn = (options?: string[]) => FilterFn;

export type FilterWithOptions = Record<string, FilterWithOptionsFn>;

export type Filters = FilterFn[];

export type FilterFnByBuiltinFiltersFn = (filters: FilterWithOptions) => FilterFn;
export type FilterFnByBuiltinFiltersFnByNameAndOptions = (name: string, options: string[]) => FilterFnByBuiltinFiltersFn;

