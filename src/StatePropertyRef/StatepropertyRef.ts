import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "./getStatePropertyRef";
import { IStatePropertyRef } from "./types";

class StatePropertyRef implements IStatePropertyRef {
  info: IStructuredPathInfo;
  listIndex: IListIndex | null;
  key: string;
  constructor(
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
  ) {
    this.info = info;
    this.listIndex = listIndex;
    this.key = createRefKey(info, listIndex);
  }
}

const refByInfoByListIndex = new WeakMap<IListIndex, Map<IStructuredPathInfo, IStatePropertyRef>>();
const refByInfoByNull = new Map<IStructuredPathInfo, IStatePropertyRef>();

export function getStatePropertyRef(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
): IStatePropertyRef {
  let ref = null;
  if (listIndex !== null) {
    let refByInfo = refByInfoByListIndex.get(listIndex);
    if (typeof refByInfo === "undefined") {
      refByInfo = new Map<IStructuredPathInfo, IStatePropertyRef>();
      refByInfoByListIndex.set(listIndex, refByInfo);
    }
    ref = refByInfo.get(info);
    if (typeof ref === "undefined") {
      ref = new StatePropertyRef(info, listIndex);
      refByInfo.set(info, ref);
    }
    return ref;
  } else {
    ref = refByInfoByNull.get(info);
    if (typeof ref === "undefined") {
      ref = new StatePropertyRef(info, null);
      refByInfoByNull.set(info, ref);
    }
    return ref;
  }
}
