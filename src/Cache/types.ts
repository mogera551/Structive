import { IStatePropertyRef } from "../StatePropertyRef/types";
import { IListIndex } from "../ListIndex/types";
import { IListDiff } from "../ListDiff/types";
import { IPropertyAccessor } from "../Updater/types";

export interface ICacheEntry {
  readonly value: any;
  readonly version: number;
  isDirty(accessor: IPropertyAccessor, tracedRefs?: Set<IStatePropertyRef>): boolean;
  setValue(value: any, version: number): void;
}


