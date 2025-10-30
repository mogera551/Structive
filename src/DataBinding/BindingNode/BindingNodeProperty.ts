import { createFilters } from "../../BindingBuilder/createFilters.js";
import { IFilterText } from "../../BindingBuilder/types";
import { Filters, FilterWithOptions } from "../../Filter/types";
import { createUpdater } from "../../Updater/Updater.js";
import { raiseError } from "../../utils.js";
import { IBinding } from "../types";
import { BindingNode } from "./BindingNode.js";
import { CreateBindingNodeFn } from "./types";

function isTwoWayBindable(element: HTMLElement): boolean {
  return element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement;
}

const defaultEventByName: Record<string, string> = {
  value: "input",
  valueAsNumber: "input",
  valueAsDate: "input",
  checked: "change",
  selected: "change",
};

type DefaultPropertyByElementType = {
  [key: string]: Set<string>;
};

const twoWayPropertyByElementType: DefaultPropertyByElementType = {
  radio: new Set(["checked"]),
  checkbox: new Set(["checked"]),
};

const VALUES_SET = new Set(["value", "valueAsNumber", "valueAsDate"]);
const BLANK_SET = new Set<string>();

/**
 * HTML要素のデフォルトプロパティを取得
 */
const getTwoWayPropertiesHTMLElement = (node: Node): Set<string> =>
  node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement || node instanceof HTMLOptionElement
    ? VALUES_SET
    : node instanceof HTMLInputElement
      ? (twoWayPropertyByElementType[node.type] ?? VALUES_SET)
      : BLANK_SET;


/**
 * BindingNodePropertyクラスは、ノードのプロパティ（value, checked, selected など）への
 * バインディング処理を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - ノードプロパティへの値の割り当て・取得
 * - 双方向バインディング（input, changeイベント等）に対応
 * - フィルタやデコレータにも対応
 *
 * 設計ポイント:
 * - デフォルトプロパティ名と一致し、かつ双方向バインディング可能な要素の場合のみイベントリスナーを登録
 * - デコレータでイベント名を指定可能（onInput, onChangeなど）
 * - イベント発火時はUpdater経由でstateを非同期的に更新
 * - assignValueでnull/undefined/NaNは空文字列に変換してセット
 */
class BindingNodeProperty extends BindingNode {
  get value(): any {
    // @ts-ignore
    return this.node[this.name];
  }
  get filteredValue(): any {
    let value = this.value;
    for (let i = 0; i < this.filters.length; i++) {
      value = this.filters[i](value);
    }
    return value;
  }
  constructor(
    binding: IBinding,
    node: Node,
    name: string,
    filters: Filters,
    decorates: string[],
  ) {
    super(binding, node, name, filters, decorates);

    const isElement = this.node instanceof HTMLElement;
    if (!isElement) return;
    if (!isTwoWayBindable(this.node)) return;
    const defaultNames = getTwoWayPropertiesHTMLElement(this.node);
    if (!defaultNames.has(this.name)) return;
    if (decorates.length > 1) {
      raiseError({
        code: "BIND-201",
        message: "Has multiple decorators",
        context: { where: "BindingNodeProperty.constructor", name: this.name, decoratesCount: decorates.length },
        docsUrl: "/docs/error-codes.md#bind",
        severity: "error",
      });
    }
    const event = (decorates[0]?.startsWith("on") ? decorates[0]?.slice(2) : decorates[0]) ?? null;
    const eventName = event ?? defaultEventByName[this.name] ?? "readonly";
    if (eventName === "readonly" || eventName === "ro") return;

    // 双方向バインディング: イベント発火時にstateを更新
    const engine = this.binding.engine;
    this.node.addEventListener(eventName, async () => {
      const loopContext = this.binding.parentBindContent.currentLoopContext;
      const value = this.filteredValue;
      await createUpdater(engine, async (updater) => {
        await updater.update(loopContext, async (state, handler) => {
          binding.updateStateValue(state, handler, value);
        });
      });
    });
  }

  init() {
    // サブクラスで初期化処理を実装可能
  }

  assignValue(value: any) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      value = "";
    }
    // @ts-ignore
    this.node[this.name] = value;
  }
}

/**
 * プロパティバインディングノード生成用ファクトリ関数
 * - name, フィルタ、デコレータ情報からBindingNodePropertyインスタンスを生成
 */
export const createBindingNodeProperty: CreateBindingNodeFn =
  (name: string, filterTexts: IFilterText[], decorates: string[]) =>
    (binding: IBinding, node: Node, filters: FilterWithOptions) => {
      const filterFns = createFilters(filters, filterTexts);
      return new BindingNodeProperty(binding, node, name, filterFns, decorates);
    };
