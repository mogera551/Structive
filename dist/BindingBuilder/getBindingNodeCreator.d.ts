import { CreateBindingNodeByNodeFn } from "../DataBinding/BindingNode/types";
import { IFilterText } from "./types";
/**
 * バインドのノードプロパティの生成関数を取得する
 * @param node ノード
 * @param propertyName プロパティ名
 * @returns {CreateBindingNodeFn} ノードプロパティのコンストラクタ
 */
export declare function getBindingNodeCreator(node: Node, propertyName: string, filterTexts: IFilterText[], event: string | null): CreateBindingNodeByNodeFn;
