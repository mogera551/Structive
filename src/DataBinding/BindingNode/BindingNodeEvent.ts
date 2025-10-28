import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { IRenderer } from "../../Updater/types.js";
import { createUpdater } from "../../Updater/Updater.js";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

/**
 * BindingNodeEventクラスは、イベントバインディング（onClick, onInputなど）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - 指定イベント（on～）に対して、バインディングされた関数をイベントリスナーとして登録
 * - デコレータ（preventDefault, stopPropagation）によるイベント制御に対応
 * - ループコンテキストやリストインデックスも引数としてイベントハンドラに渡す
 * - ハンドラ実行時はstateProxyを生成し、Updater経由で非同期的に状態を更新
 *
 * 設計ポイント:
 * - nameからイベント名（subName）を抽出し、addEventListenerで登録
 * - バインディング値が関数でない場合はエラー
 * - デコレータでpreventDefault/stopPropagationを柔軟に制御
 * - ループ内イベントにも対応し、リストインデックスを引数展開
 */
class BindingNodeEvent extends BindingNode {
  #subName    : string;
  constructor(
    binding   : IBinding, 
    node      : Node, 
    name      : string,
    filters   : Filters,
    decorates : string[]
  ) {
    super(binding, node, name, filters, decorates);
    this.#subName = this.name.slice(2); // on～
    const element = node as HTMLElement;
    element.addEventListener(this.subName, (e:Event) => this.handler(e));
  }
  get subName(): string {
    return this.#subName;
  }
  update() {
    // 何もしない（イベントバインディングは初期化時のみ）
  }

  async handler(e: Event) {
    const engine = this.binding.engine;
    const loopContext = this.binding.parentBindContent.currentLoopContext;
    const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
    const options = this.decorates;
    if (options.includes("preventDefault")) {
      e.preventDefault();
    }
    if (options.includes("stopPropagation")) {
      e.stopPropagation();
    }
    await createUpdater(engine, async (updater) => {
      await updater.update(loopContext, async (state, handler) => {
        // stateProxyを生成し、バインディング値を実行
        const func = this.binding.bindingState.getValue(state, handler);
        if (typeof func !== "function") {
          raiseError({
            code: 'BIND-201',
            message: `${this.name} is not a function`,
            context: { where: 'BindingNodeEvent.handler', name: this.name, receivedType: typeof func },
            docsUrl: '/docs/error-codes.md#bind',
            severity: 'error',
          });
        }
        await Reflect.apply(func, state, [e, ...indexes]);
      });
    });
  }
  applyChange(renderer: IRenderer): void {
    // イベントバインディングは初期化時のみで、状態変更時に何もしない
  }
}

/**
 * イベントバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeEventインスタンスを生成
 */
export const createBindingNodeEvent: CreateBindingNodeFn = 
(name: string, filterTexts: IFilterText[], decorates: string[]) => 
  (binding:IBinding, node: Node, filters: FilterWithOptions) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
  }
