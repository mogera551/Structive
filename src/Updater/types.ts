import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { IStateProxy } from "../StateClass/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface IUpdater {
  version: number;
  readonly engine: IComponentEngine;
  readonly readonlyState: IStateProxy;
  readonly updatedValues: {[key:string]: any};
  addProcess(process: () => Promise<void> | void): void;
  addUpdatedStatePropertyRefValue(info: IStructuredPathInfo, listIndex: IListIndex | null, value:any): void;
  addUpdatedListIndex(listIndex: IListIndex): void;
  getUpdatedProperties(): Set<IStatePropertyRef | IListIndex>;
}

export type UpdatedArrayElementBinding = {
  parentRef: IStatePropertyRef;
  binding: IBinding;
  listIndexes: IListIndex[];
  values: any[];
};
