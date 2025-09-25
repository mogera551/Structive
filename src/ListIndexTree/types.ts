import { IListIndex } from "../ListIndex/types";

export interface IListIndexTree {
  addChildIndexes(parent: IListIndex | null, children: IListIndex[]): void;
  getListIndexes(parent: IListIndex | null): IListIndex[];
}