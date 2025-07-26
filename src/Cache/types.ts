import { IWritableStateProxy } from "../StateClass/types";

// キャッシュ情報
export interface ICacheEntry {
  get dirty(): boolean;
  getVersion(tracePaths: Set<string>): number;
  getValue(state: IWritableStateProxy, version: number): any;
  setValue(state: IWritableStateProxy, value: any, version: number): boolean;
}

export interface ICacheManager {
  getVersion(): number;
}