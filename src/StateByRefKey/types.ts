import { IListIndex } from "../ListIndex/types";

export interface IStateByRefKey {
  exists(path: string, listIndex: IListIndex | null): boolean;
  getEntry(path: string, listIndex: IListIndex | null): Entry | null;
  setEntry(path: string, listIndex: IListIndex | null, entry: Entry): void;
}

export interface Entry {
  get path(): string;
  get listIndex(): IListIndex | null;
  get disposable(): boolean;
  setValue(newValue: any, version: number): void;
  getValue(version: number): any;
}