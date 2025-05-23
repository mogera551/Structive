/**
 * restructListIndex.ts
 *
 * StateClassのリストインデックス構造を再構築するためのユーティリティです。
 *
 * 主な役割:
 * - buildListIndexTree: 指定されたinfo/listIndex/valueに基づき、リストインデックスのツリー構造を再構築・更新
 *   - 既存のリストインデックスと新しいリスト要素を比較し、必要に応じてインデックスを再割り当て
 *   - インデックス変更時はengine.updater.addUpdatedListIndexで更新情報を登録
 *   - 新しいリストインデックス集合をengine.saveListIndexesSetで保存
 * - restructListIndexes: 依存関係を辿りながら、必要なリストインデックスの再構築を一括で実行
 *   - 依存関係のある全てのinfo/listIndexに対してbuildListIndexTreeを呼び出し
 *   - キャッシュやrefKeyを利用して重複処理や不要な再構築を防止
 *   - config.optimizeListElementsやoptimizeListによる最適化にも対応
 *
 * 設計ポイント:
 * - 依存関係の再帰的な探索と、リストインデックスの効率的な再利用・再構築を両立
 * - スワップや最適化設定時のスキップ処理、キャッシュによる高速化
 * - リストバインディングや多重ループ時のインデックス整合性を担保
 */
import { IComponentEngine } from "../ComponentEngine/types";
import { createDependencyWalker } from "../DependencyWalker/createDependencyWalker";
import { createListIndex } from "../ListIndex/createListIndex";
import { IListIndex } from "../ListIndex/types";
import { listWalker } from "../ListWalker/listWalker";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { config } from "../WebComponents/getGlobalConfig";

const BLANK_LISTINDEXES_SET = new Set<IListIndex>();

function buildListIndexTree(
  engine   : IComponentEngine, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null, 
  value: any[]
): void {
  const oldValue = engine.getList(info, listIndex) ?? [];
  if (oldValue === value) {
    return;
  }
  const newListIndexesSet:Set<IListIndex> = new Set();
  const oldListIndexesSet = engine.getListIndexesSet(info, listIndex) ?? BLANK_LISTINDEXES_SET;
  const oldListIndexesByItem = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
  for(let i = 0; i < value.length; i++) {
    // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
    // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
    let curListIndex = oldListIndexesByItem.get(value[i])?.shift() ?? createListIndex(listIndex, i);
    if (curListIndex.index !== i) {
      curListIndex.index = i;
      // リストインデックスのインデックスを更新したので、リストインデックスを登録する
      engine.updater.addUpdatedListIndex(curListIndex);
    }
    // リストインデックスを新しいリストインデックスセットに追加する
    newListIndexesSet.add(curListIndex);
  }
  // 新しいリストインデックスセットを保存する
  engine.saveListIndexesSet(info, listIndex, newListIndexesSet);
  engine.saveList(info, listIndex, value.slice(0)); // コピーを保存

}

export function restructListIndexes(
  infos: IStatePropertyRef[],
  engine: IComponentEngine,
  updateValues: {[key:string]: any[]},
  refKeys: Set<string>,
  cache: Map<IStructuredPathInfo, Set<IListIndex|null>>,
) {
  for(const {info, listIndex} of infos) {
    if (config.optimizeListElements && engine.elementInfoSet.has(info)) {
      // スワップ処理のためスキップ
      continue;
    }
    const dependentWalker = createDependencyWalker(engine, {info, listIndex});
    const nowOnList = config.optimizeList && engine.listInfoSet.has(info);
    dependentWalker.walk((ref, refInfo, type) => {
      if (nowOnList && type === "structured" && ref.info !== refInfo) {
        if (refInfo.cumulativeInfoSet.has(ref.info)) {
          return;
        }
      }
      const wildcardMatchPaths = Array.from(ref.info.wildcardInfoSet.intersection(refInfo.wildcardInfoSet));
      const longestMatchAt = (wildcardMatchPaths.at(-1)?.wildcardCount ?? 0) - 1;
      const listIndex = (longestMatchAt >= 0) ? (ref.listIndex?.at(longestMatchAt) ?? null) : null;
      listWalker(engine, refInfo, listIndex, (_info, _listIndex) => {
        if (!engine.existsBindingsByInfo(_info)) {
          return;
        }
        const refKey = createRefKey(_info, _listIndex);
        if (refKeys.has(refKey)) {
          return;
        }
        let cacheListIndexSet = cache.get(_info);
        if (!cacheListIndexSet) {
          cacheListIndexSet = new Set<IListIndex|null>();
          cache.set(_info, cacheListIndexSet);
        }
        cacheListIndexSet.add(_listIndex);
        refKeys.add(refKey);
        if (engine.listInfoSet.has(_info)) {
          const values = updateValues[refKey] ?? engine.readonlyState[GetByRefSymbol](_info, _listIndex);
          buildListIndexTree(engine, _info, _listIndex, values);
        }
      });
    });
  }
}

