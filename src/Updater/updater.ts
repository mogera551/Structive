/**
 * updater.ts
 *
 * StateClassの更新処理・変更検知・再描画を一元管理するUpdaterクラスの実装ファイルです。
 *
 * 主な役割:
 * - Stateプロパティやリストインデックスの変更を検知し、再描画や依存解決をトリガー
 * - addUpdatedStatePropertyRefValue/addUpdatedListIndexで変更情報を登録し、entryRenderで描画処理をエントリーポイント化
 * - rebuildで変更の影響範囲を再計算し、必要なバインディングやリストインデックスの再構築を実行
 * - renderでバインディング配列をまとめて描画
 *
 * 設計ポイント:
 * - 変更検知・再描画を非同期でバッチ処理し、パフォーマンスを最適化
 * - リストバインディングや多重ループ、スワップ・最適化にも対応
 * - StateClassエンジンとの連携やキャッシュ機構も考慮した設計
 */
import { IBinding } from "../DataBinding/types";
import { render } from "./render.js";
import { SetCacheableSymbol } from "../StateClass/symbols.js";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { raiseError } from "../utils.js";
import { IUpdater } from "./types";
import { restructListIndexes } from "./restructListIndex";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { IListIndex2 } from "../ListIndex2/types";

type UpdatedArrayElementBinding = {
  parentRef: IStatePropertyRef;
  binding: IBinding;
  listIndexes: IListIndex2[];
  values: any[];
};

class Updater implements IUpdater {
  updatedProperties: Set<IStatePropertyRef | IListIndex2> = new Set;
  updatedValues    : {[key:string]: any} = {};
  engine           : IComponentEngine;
  #version         : number = 0;

  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  get version(): number {
    return this.#version;
  }

  addProcess(process: () => Promise<void> | void): void {
    queueMicrotask(process);
  }

  addUpdatedStatePropertyRefValue(
    info     : IStructuredPathInfo, 
    listIndex: IListIndex2 | null, 
    value    : any
  ): void {
    const refKey = createRefKey(info, listIndex);
    this.updatedProperties.add({info, listIndex});
    this.updatedValues[refKey] = value;
    this.entryRender();
  }

  addUpdatedListIndex(listIndex: IListIndex2): void {
    this.updatedProperties.add(listIndex);
    this.entryRender();
  }

  #isEntryRender = false;
  entryRender() {
    if (this.#isEntryRender) return;
    this.#isEntryRender = true;
    const engine = this.engine;
    queueMicrotask(() => {
      try {
        const { bindings, arrayElementBindings, properties } = this.rebuild();
        // スワップ処理
        for(const arrayElementBinding of arrayElementBindings) {
          arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
        }
        // レンダリング
        if (bindings.length > 0) {
          this.render(bindings);
        }
        // 子コンポーネントへの再描画通知
        if (engine.structiveChildComponents.size > 0) {
          for(const structiveComponent of engine.structiveChildComponents) {
            const structiveComponentBindings = engine.bindingsByComponent.get(structiveComponent) ?? new Set<IBinding>();
            for(const binding of structiveComponentBindings) {
              binding.notifyRedraw(properties);
            }
          }
        }
      } finally {
        this.#isEntryRender = false;
      }
    });
  }

  rebuild(): {
    bindings: IBinding[], 
    arrayElementBindings: UpdatedArrayElementBinding[],
    properties: IStatePropertyRef[]
  } {
    const retArrayElementBindings: UpdatedArrayElementBinding[] = [];
    const retBindings: IBinding[] = [];
    const retProperties: IStatePropertyRef[] = [];
    const engine = this.engine;
    const hasChildComponent = engine.structiveChildComponents.size > 0;
    while(this.updatedProperties.size > 0) {
      const updatedProiperties = Array.from(this.updatedProperties.values());
      this.updatedProperties.clear();
      const bindingsByListIndex: IBinding[] = [];
      const updatedRefs: IStatePropertyRef[] = []; // 更新されたプロパティ参照のリスト
      const arrayElementBindingByParentRefKey = new Map<string, Partial<UpdatedArrayElementBinding>>();
      for(let i = 0; i < updatedProiperties.length; i++) {
        const item = updatedProiperties[i];
        if ("index" in item) {
          const bindings = engine.bindingsByListIndex.get(item as IListIndex2) ?? [];
          bindingsByListIndex.push(...bindings);
        } else {
          updatedRefs.push(item as IStatePropertyRef);
          if (engine.elementInfoSet.has(item.info)) {
            const parentInfo = item.info.parentInfo ?? raiseError("info is null"); // リストのパス情報
            const parentListIndex = item.listIndex?.at(-2) ?? null; // リストのインデックス
            const parentRef = {info: parentInfo, listIndex: parentListIndex};
            const parentRefKey = createRefKey(parentInfo, parentListIndex);
            let info = arrayElementBindingByParentRefKey.get(parentRefKey);
            if (!info) {
              info = {
                parentRef,
                listIndexes: [],
                values: []
              };
              arrayElementBindingByParentRefKey.set(parentRefKey, info);
            }
            const refKey = createRefKey(item.info, item.listIndex);
            const value = this.updatedValues[refKey] ?? null;
            info.values?.push(value);
            info.listIndexes?.push(item.listIndex as IListIndex2);
          }
        }
      }
      // リストインデックスの構築
      const builtStatePropertyRefKeySet = new Set<string>();
      const affectedRefs = new Map<IStructuredPathInfo, Set<IListIndex2 | null>>();
      restructListIndexes(updatedRefs, engine, this.updatedValues, builtStatePropertyRefKeySet, affectedRefs);

      // スワップの場合の情報を構築する
      for(const [parentRefKey, info] of arrayElementBindingByParentRefKey) {
        const parentInfo = info.parentRef?.info ?? raiseError("parentInfo is null");
        const parentListIndex = info.parentRef?.listIndex ?? null;
        const bindings = engine.getBindings(parentInfo, parentListIndex);
        for(const binding of bindings) {
          if (!binding.bindingNode.isFor) {
            continue;
          }
          const bindingInfo = Object.assign({}, info, { binding });
          retArrayElementBindings.push(bindingInfo as UpdatedArrayElementBinding);
        }
      }
      // 影響する全てのバインド情報を取得する
      for(const [ info, listIndexes ] of affectedRefs.entries()) {
        for(const listIndex of listIndexes) {
          const bindings = engine.getBindings(info, listIndex);
          retBindings.push(...bindings ?? []);
          if (hasChildComponent) {
            retProperties.push({info, listIndex});
          }
        }
      }
      retBindings.push(...bindingsByListIndex);
    }
    this.updatedValues = {};
    return {
      bindings: retBindings, 
      arrayElementBindings: retArrayElementBindings,
      properties: retProperties
    };
  }

  render(bindings: IBinding[]) {
    this.#version++;
    this.engine.readonlyState[SetCacheableSymbol](() => {
      return render(bindings);
    });
  }
}

export function createUpdater(engine: IComponentEngine): IUpdater {
  return new Updater(engine);
}

