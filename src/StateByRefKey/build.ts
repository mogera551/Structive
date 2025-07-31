import { IComponentPathManager } from "../ComponentPath/types";
import { createListIndex } from "../ListIndex/createListIndex";
import { IListIndex } from "../ListIndex/types";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { createEntry } from "./Entry";
import { IEntry, IStateByRefKey } from "./types";

class StateBuilder {
  #pathManager: IComponentPathManager;
  #stateByRefKey: IStateByRefKey;
  #state: IReadonlyStateProxy;
  constructor(
    pathManager: IComponentPathManager,
    stateByRefKey: IStateByRefKey,
    state: IReadonlyStateProxy
  ) {
    this.#pathManager = pathManager;
    this.#stateByRefKey = stateByRefKey;
    this.#state = state;
  }

  getValue(
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
    parentValue: any
  ): any {
    // 値の取得方法
    let value: any;
    if (this.#pathManager.getters.has(info.pattern)) {
      // getterが存在する場合はgetterを呼び出す
      value = this.#state[GetByRefSymbol](info, listIndex);
    } else {
      // getterが存在しない場合は直接値を取得
      if (info.pathSegments.length > 1) {
        // プリミティブでない場合は、親の値から取得
        if (info.lastSegment === "*") {
          // ワイルドカードの場合はインデックスから取得
          if (!listIndex) {
            raiseError(`ListIndex is required for wildcard path: ${info.pattern}`);
          }
          value = parentValue[listIndex.index];
        } else {
          value = parentValue[info.lastSegment];
        }
      } else {
        // プリミティブの場合は直接値を取得
        value = this.#state[info.pattern];
      }
    }
    return value;
  }

  buildEntry(
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
    parentValue: any,
    parentEntry: IEntry | null,
    version: number
  ): void {
    const value = this.getValue(info, listIndex, parentValue);
    // エントリを作成して登録
    const entry = createEntry(
      parentEntry,
      info.pattern,
      listIndex,
      value,
      version
    );
    this.#stateByRefKey.setEntry(info.pattern, listIndex, entry);

    // 構造に合わせて子エントリを作成
    const refPaths = this.#pathManager.staticDependencies.get(info.pattern) ?? [];
    const listIndexes = [];
    for (const refPath of refPaths) {
      const refInfo = getStructuredPathInfo(refPath);
      if (this.#pathManager.elements.has(refPath)) {
        for(let i = 0; i < value.length; i++) {
          const refListIndex = createListIndex(listIndex, i);
          listIndexes.push(refListIndex);
          this.buildEntry(
            refInfo,
            refListIndex,
            value,
            entry,
            version
          );
        }
      } else {
        this.buildEntry(
          refInfo,
          listIndex,
          value,
          entry,
          version
        );
      }
    }
  }

  build(): void {
    // 全てのパスを走査してエントリを構築
    for (const path of this.#pathManager.paths) {
      const info = getStructuredPathInfo(path);
      if (info.pathSegments.length > 1) {
        continue; // プリミティブでない場合はスキップ
      }
      this.buildEntry(info, null, null, null, 0);
    }
  }
}

export function buildAll(
  pathManager: IComponentPathManager,
  stateByRefKey: IStateByRefKey,
  state: IReadonlyStateProxy
):void {
  const builder = new StateBuilder(
    pathManager,
    stateByRefKey,
    state
  );
  builder.build();
}
