import { IComponentPathManager } from "../ComponentPath/types";
import { createListIndex } from "../ListIndex/createListIndex";
import { IListIndex } from "../ListIndex/types";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { createEntry } from "./Entry";
import { IEntry, IStateByRefKey } from "./types";

type RetryEntryInfo = {
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
    parentValue: any,
    parentEntry: IEntry | null,
    version: number,
}

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
      // 構築時ににまだツリーに登録されていない場合、例外を返してあとで再試行する
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
    version: number,
    retryEntryInfos: RetryEntryInfo[] = []
  ): void {
    let value;
    try {
      value = this.getValue(info, listIndex, parentValue);
    } catch(error) {
      // 構築時ににまだツリーに登録されていない場合、例外を返してあとで再試行する
      const retryInfo: RetryEntryInfo = {
        info,
        listIndex,
        parentValue,
        parentEntry,
        version
      };
      retryEntryInfos.push(retryInfo);
      return;
    }
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
            version,
            retryEntryInfos
          );
        }
      } else {
        this.buildEntry(
          refInfo,
          listIndex,
          value,
          entry,
          version,
          retryEntryInfos
        );
      }
    }
  }

  build(): void {
    // 全てのパスを走査してエントリを構築
    const retryEntryInfos: RetryEntryInfo[] = [];
    for (const path of this.#pathManager.paths) {
      const info = getStructuredPathInfo(path);
      if (info.pathSegments.length > 1) {
        continue; // プリミティブでない場合はスキップ
      }
      this.buildEntry(info, null, null, null, 0, retryEntryInfos);
    }
    // 再試行が必要なエントリを再構築
    let rebuildRetryEntryInfos = retryEntryInfos;
    while( rebuildRetryEntryInfos.length > 0) {
      const reretryEntryInfos: RetryEntryInfo[] = [];
      for (const retryInfo of rebuildRetryEntryInfos) {
        const { info, listIndex, parentValue, parentEntry, version } = retryInfo;
        this.buildEntry(info, listIndex, parentValue, parentEntry, version, reretryEntryInfos);
      }
      // 再試行が必要なエントリがあれば再度ループ
      const refKeys = new Set(rebuildRetryEntryInfos.map(info => getStatePropertyRefKey(info.info.pattern, info.listIndex)));
      const rerefKeys = new Set(reretryEntryInfos.map(info => getStatePropertyRefKey(info.info.pattern, info.listIndex)));
      if (refKeys.size > 0 && rerefKeys.size > 0) {
        const diff = refKeys.difference(rerefKeys);
        if (diff.size === 0) {
          // 再試行が必要なエントリが同じ場合は、相互参照のため処理中断
          raiseError("Circular reference detected in StateByRefKey entries.");
        }
      }
      rebuildRetryEntryInfos = reretryEntryInfos;
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
