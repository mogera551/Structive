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

/**
 * Builds the state by reference key.
 * @param stateByRefKey 
 * @param pathManager 
 * @param path 
 * @param listIndex 
 * @param value 
 * @param version 
 */
export function build(
  stateByRefKey: IStateByRefKey,
  pathManager: IComponentPathManager,
  path: string,
  listIndex: IListIndex | null,
  value: any,
  version: number,
) {
  let entry = stateByRefKey.getEntry(path, listIndex);
  if (!entry) {
    // ToDo: parentEntryの取得方法を検討する
    const parentEntry = null; // ここは適切な親エントリを
    entry = createEntry(
      parentEntry,
      path,
      listIndex,
      value,
      version
    )
    stateByRefKey.setEntry(path, listIndex, entry);
  }
  entry.setValue(value, version);
}

function getValue(
  pathManager: IComponentPathManager,
  state: IReadonlyStateProxy,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  parentValue: any
): any {
  // 値の取得方法
  let value: any;
  if (pathManager.getters.has(info.pattern)) {
    // getterが存在する場合はgetterを呼び出す
    value = state[GetByRefSymbol](info, listIndex);
  } else {
    // getterが存在しない場合は直接値を取得
    if (info.pathSegments.length > 0) {
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
      value = state[info.pattern];
    }
  }
  return value;
}

function buildEntry(
  pathManager: IComponentPathManager,
  stateByRefKey: IStateByRefKey,
  state: IReadonlyStateProxy,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  parentValue: any,
  parentEntry: IEntry | null,
  version: number
) {
  const value = getValue(pathManager, state, info, listIndex, parentValue);
  // エントリを作成して登録
  const entry = createEntry(
    parentEntry,
    info.pattern,
    listIndex,
    value,
    version
  );
  stateByRefKey.setEntry(info.pattern, listIndex, entry);

  // 構造に合わせて子エントリを作成
  const refPaths = pathManager.staticDependencies.get(info.pattern) ?? [];
  const listIndexes = [];
  for (const refPath of refPaths) {
    const refInfo = getStructuredPathInfo(refPath);
    if (pathManager.lists.has(refPath)) {
      for(let i = 0; i < value.length; i++) {
        const refListIndex = createListIndex(listIndex, i);
        listIndexes.push(refListIndex);
        buildEntry(
          pathManager,
          stateByRefKey,
          state,
          refInfo,
          refListIndex,
          value,
          entry,
          version
        );
      }
    } else {
      buildEntry(
        pathManager,
        stateByRefKey,
        state,
        refInfo,
        listIndex,
        value,
        entry,
        version
      );
    }
  }
  // リストインデックスの登録
}

export function buildAll(
  pathManager: IComponentPathManager,
  stateByRefKey: IStateByRefKey,
  state: IReadonlyStateProxy
) {
  for(const path of pathManager.paths) {
    const info = getStructuredPathInfo(path);
    if (info.pathSegments.length > 0) {
      continue; // プリミティブでない場合はスキップ
    }
    buildEntry(
      pathManager,
      stateByRefKey,
      state,
      info,
      null,
      null,
      null,
      0
    );

  }

}