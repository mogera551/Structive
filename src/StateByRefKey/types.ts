import { IListIndex } from "../ListIndex/types";

export interface IStateByRefKey {
  exists(path: string, listIndex: IListIndex | null): boolean;
  getEntry(path: string, listIndex: IListIndex | null): IEntry | null;
  setEntry(path: string, listIndex: IListIndex | null, entry: IEntry): void;
}

export interface IEntry {
  get path(): string;
  get listIndex(): IListIndex | null;
  get disposable(): boolean;
  setValue(newValue: any, version: number): void;
  getValue(version: number): any;
}