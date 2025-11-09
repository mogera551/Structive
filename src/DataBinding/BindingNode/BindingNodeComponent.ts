import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { NotifyRedrawSymbol } from "../../ComponentStateInput/symbols.js";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { IStatePropertyRef } from "../../StatePropertyRef/types.js";
import { IRenderer } from "../../Updater/types.js";
import { registerStructiveComponent } from "../../WebComponents/findStructiveParent.js";
import { StructiveComponent } from "../../WebComponents/types";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeComponentクラスは、StructiveComponent（カスタムコンポーネント）への
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - バインディング対象のコンポーネントのstateプロパティ（subName）に値を反映
 * - バインディング情報をコンポーネント単位で管理（bindingsByComponentに登録）
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - nameからstateプロパティ名（subName）を抽出（例: "state.foo" → "foo"）
 * - assignValueでコンポーネントのstateに値をセット（RenderSymbol経由で反映）
 * - 初期化時にbindingsByComponentへバインディング情報を登録
 * - 柔軟なバインディング記法・フィルタ適用に対応
 */
class BindingNodeComponent extends BindingNode {
  #subName: string;
  get subName():string {
    return this.#subName;
  }
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    const [, subName] = this.name.split(".");
    this.#subName = subName;
  }

  init(): void {
    const engine = this.binding.engine;
    registerStructiveComponent(engine.owner, this.node as StructiveComponent);
    let bindings = engine.bindingsByComponent.get(this.node as StructiveComponent);
    if (typeof bindings === "undefined") {
      engine.bindingsByComponent.set(this.node as StructiveComponent, bindings = new Set<IBinding>());
    }
    bindings.add(this.binding);
  }

  _notifyRedraw(refs: IStatePropertyRef[]): void {
    const component = this.node as StructiveComponent;
    // コンポーネントが定義されるのを待ち、初期化完了後に notifyRedraw を呼び出す
    const tagName = component.tagName.toLowerCase();
    customElements.whenDefined(tagName).then(() => {
      component.waitForInitialize.promise.then(() => {
        component.state[NotifyRedrawSymbol](refs);
      });
    });
  }

  applyChange(renderer: IRenderer): void {
    this._notifyRedraw([this.binding.bindingState.ref]);
  }

  notifyRedraw(refs: IStatePropertyRef[]): void {
    const notifyRefs: IStatePropertyRef[] = [];
    const compRef = this.binding.bindingState.ref;
    const listIndex = compRef.listIndex;
    const atIndex = (listIndex?.length ?? 0) - 1;
    for(const ref of refs) {
      if (ref.info.pattern === compRef.info.pattern) {
        // applyChangeで処理済みなのでスキップ
        continue;
      }
      if (!ref.info.cumulativePathSet.has(compRef.info.pattern)) {
        continue;
      }
      if (atIndex >= 0) {
        if (ref.listIndex?.at(atIndex) !== listIndex) {
          continue;
        }
      }
      notifyRefs.push(ref);
    }
    if (notifyRefs.length === 0) {
      return;
    }
    this._notifyRedraw(notifyRefs);
  }
}

/**
 * コンポーネント用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeComponentインスタンスを生成
 */
export const createBindingNodeComponent: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, decorates);
  }
