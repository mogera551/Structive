/**
 * StatePropertyRef
 *
 * 目的:
 * - State の構造化パス情報(IStructuredPathInfo)と、任意のリストインデックス(IListIndex)から
 *   一意な参照オブジェクト(IStatePropertyRef)を生成・キャッシュする。
 * - 同一(info,listIndex)組み合わせに対しては同一インスタンスを返し、比較やMapキーとして安定運用できるようにする。
 *
 * 実装メモ:
 * - key は info.sid と listIndex.sid から合成（listIndex が null の場合は info.sid のみ）
 * - listIndex は WeakRef で保持し、GC で消えた場合は LIST-201 を送出
 * - キャッシュは listIndex 非 null の場合は WeakMap(listIndex) 配下に、null の場合は Map(info) に保持
 */
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { IStatePropertyRef } from "./types";

class StatePropertyRef implements IStatePropertyRef {
  info: IStructuredPathInfo;
  #listIndexRef: WeakRef<IListIndex> | null;
  get listIndex(): IListIndex | null {
    if (this.#listIndexRef === null) return null;
    return this.#listIndexRef.deref() ?? raiseError({
      code: "LIST-201",
      message: "listIndex is null",
      context: { sid: this.info.sid, key: this.key },
      docsUrl: "./docs/error-codes.md#list",
    });
  }
  key: string;
  constructor(
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
  ) {
    this.info = info;
    this.#listIndexRef = listIndex !== null ? new WeakRef(listIndex) : null;
    this.key = (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
  }

  get parentRef(): IStatePropertyRef | null {
    const parentInfo = this.info.parentInfo;
    if (!parentInfo) return null;
    const parentListIndex = (this.info.wildcardCount > parentInfo.wildcardCount ? this.listIndex?.at(-2) : this.listIndex) ?? null;
    return getStatePropertyRef(parentInfo, parentListIndex);
  }
}

const refByInfoByListIndex: WeakMap<IListIndex, Record<string, IStatePropertyRef>> = new WeakMap();
const refByInfoByNull: Record<string, IStatePropertyRef> = {};

export function getStatePropertyRef(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
): IStatePropertyRef {
  let ref = null;
  if (listIndex !== null) {
    let refByInfo;
    if (typeof (refByInfo = refByInfoByListIndex.get(listIndex)) === "undefined") {
      ref = new StatePropertyRef(info, listIndex);
      refByInfoByListIndex.set(listIndex, { [info.pattern]: ref });
    } else {
      if (typeof (ref = refByInfo[info.pattern]) === "undefined") {
        return refByInfo[info.pattern] = new StatePropertyRef(info, listIndex);
      }
    }
  } else {
    if (typeof (ref = refByInfoByNull[info.pattern]) === "undefined") {
      return refByInfoByNull[info.pattern] = new StatePropertyRef(info, null);
    }
  }
  return ref;
}
