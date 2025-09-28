import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { createRefKey } from "./getStatePropertyRef";
import { IStatePropertyRef } from "./types";

class StatePropertyRef implements IStatePropertyRef {
  info: IStructuredPathInfo;
  #listIndexRef: WeakRef<IListIndex> | null;
  get listIndex(): IListIndex | null {
    if (this.#listIndexRef === null) return null;
    return this.#listIndexRef.deref() ?? raiseError("listIndex is null");
  }
  key: string;
  constructor(
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
  ) {
    this.info = info;
    this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
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
