import { IListIndex } from "../ListIndex/types";
import { IListIndexTree } from "./types";

class ListIndexTree implements IListIndexTree {
  rootIndexes: IListIndex[] = [];
  map: WeakMap<IListIndex, IListIndex[]> = new WeakMap();

  addChildIndexes(parent: IListIndex | null, children: IListIndex[]): void {
    if (parent) {
      this.map.set(parent, children);
    } else {
      this.rootIndexes = children;
    }
  }

  getListIndexes(parent: IListIndex | null): IListIndex[] {
    if (parent) {
      return this.map.get(parent) || [];
    } else {
      return this.rootIndexes;
    }
  }
  
}

export function createListIndexTree(): IListIndexTree {
  return new ListIndexTree();
}
