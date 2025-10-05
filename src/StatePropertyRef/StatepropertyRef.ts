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

function createRefKey(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
) {
  return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}

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
    this.key = createRefKey(info, listIndex);
  }

  #parentRef: IStatePropertyRef | null | undefined = undefined;
  getParentRef(): IStatePropertyRef | null {
    if (typeof this.#parentRef !== "undefined") {
      return this.#parentRef;
    }
    const parentInfo = this.info.parentInfo;
    if (parentInfo === null) return (this.#parentRef = null);
    if (parentInfo.wildcardCount === this.info.wildcardCount) {
      return (this.#parentRef = getStatePropertyRef(parentInfo, this.listIndex));
    } else if (parentInfo.wildcardCount < this.info.wildcardCount) {
      if (parentInfo.wildcardCount > 0) {
        const parentListIndex = this.listIndex?.at(parentInfo.wildcardCount - 1) ?? raiseError({
          code: 'BIND-201',
          message: 'Inconsistent wildcard count between parentInfo and info',
          context: { infoPattern: this.info.pattern, parentPattern: parentInfo.pattern },
          docsUrl: '/docs/error-codes.md#bind',
          severity: 'error',
        });
        return (this.#parentRef = getStatePropertyRef(parentInfo, parentListIndex));
      } else {
        return (this.#parentRef = getStatePropertyRef(parentInfo, null));
      }
    } else {
      raiseError({
        code: 'BIND-201',
        message: 'Inconsistent wildcard count between parentInfo and info',
        context: { infoPattern: this.info.pattern, parentPattern: parentInfo.pattern },
        docsUrl: '/docs/error-codes.md#bind',
        severity: 'error',
      });
    }
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
