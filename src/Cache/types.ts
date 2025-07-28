import { IListIndex } from "../ListIndex/types";
import { IWritableStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";

// キャッシュ情報
export interface ICacheEntry {
  get dirty(): boolean;
  getVersion(tracePaths: Set<string>): number;
  getValue(state: IWritableStateProxy, version: number): any;
  setValue(state: IWritableStateProxy, value: any, version: number): boolean;
}

export interface ICacheManager {
  getVersion(): number;
  getEntry(info: IStructuredPathInfo, listIndex: IListIndex | null): ICacheEntry | undefined;
  getValue(state: IWritableStateProxy, info: IStructuredPathInfo, listIndex: IListIndex | null): any;
  setValue(state: IWritableStateProxy, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): boolean;
}