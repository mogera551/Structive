import { createFilters } from "../../BindingBuilder/createFilters.js";
import { NotifyRedrawSymbol } from "../../ComponentStateInput/symbols.js";
import { registerStructiveComponent } from "../../WebComponents/findStructiveParent.js";
import { BindingNode } from "./BindingNode.js";
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
    #subName;
    get subName() {
        return this.#subName;
    }
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        const [, subName] = this.name.split(".");
        this.#subName = subName;
    }
    init() {
        const engine = this.binding.engine;
        registerStructiveComponent(engine.owner, this.node);
        let bindings = engine.bindingsByComponent.get(this.node);
        if (typeof bindings === "undefined") {
            engine.bindingsByComponent.set(this.node, bindings = new Set());
        }
        bindings.add(this.binding);
    }
    assignValue(value) {
    }
    notifyRedraw(refs) {
        const notifyRefs = [];
        const info = this.binding.bindingState.info;
        const listIndex = this.binding.bindingState.listIndex?.at(info.wildcardCount - 1) ?? null;
        const at = (listIndex?.length ?? 0) - 1;
        for (const ref of refs) {
            if (info.pathSegments.length > ref.info.pathSegments.length) {
                // 親パスが更新された
                // ex values, values.* valuesが更新された場合
                if (info.cumulativePathSet.has(ref.info.pattern)) {
                    const thisAt = (ref.listIndex?.length ?? 0) - 1;
                    if (thisAt >= 0) {
                        if (listIndex === null)
                            continue;
                        if (ref.listIndex !== listIndex?.at(thisAt))
                            continue;
                    }
                    notifyRefs.push({ info, listIndex });
                }
            }
            else {
                // 子パスが更新された
                // ex values.*.foo values.* values.*.fooが更新された
                if (!ref.info.cumulativePathSet.has(info.pattern)) {
                    // リストインデックスが一致しない場合はスキップ
                    if (at >= 0) {
                        if (ref.listIndex?.at(at) !== listIndex)
                            continue;
                    }
                    notifyRefs.push(ref);
                }
            }
        }
        if (notifyRefs.length === 0) {
            return;
        }
        const component = this.node;
        component.state[NotifyRedrawSymbol](notifyRefs);
    }
}
/**
 * コンポーネント用バインディングノード生成ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodeComponentインスタンスを生成
 */
export const createBindingNodeComponent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeComponent(binding, node, name, filterFns, decorates);
};
