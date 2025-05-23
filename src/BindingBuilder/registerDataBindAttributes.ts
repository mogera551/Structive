import { createDataBindAttributes } from "./createDataBindAttributes.js";
import { getNodesHavingDataBind } from "./getNodesHavingDataBind.js";
import { IDataBindAttributes } from "./types";

const listDataBindAttributesById: {[key:number]:IDataBindAttributes[]} = {};

const listPathsSetById: {[key:number]:Set<string>} = {};

const pathsSetById: {[key:number]:Set<string>} = {};

function getDataBindAttributesFromTemplate(content: DocumentFragment): IDataBindAttributes[] {
  const nodes = getNodesHavingDataBind(content);
  return nodes.map(node => createDataBindAttributes(node));
}

/**
 * テンプレート（DocumentFragment）内のバインディング情報（data-bind属性やコメント）を解析・登録し、
 * 各テンプレートIDごとにバインディング属性情報・状態パス集合を管理するユーティリティ。
 *
 * - getNodesHavingDataBindで対象ノードを抽出し、createDataBindAttributesで解析
 * - 各テンプレートIDごとにバインディング属性リスト・状態パス集合・リストパス集合をキャッシュ
 * - forバインディング（ループ）のstatePropertyはlistPathsにも登録
 *
 * @param id      テンプレートID
 * @param content テンプレートのDocumentFragment
 * @param rootId  ルートテンプレートID（省略時はidと同じ）
 * @returns       解析済みバインディング属性リスト
 */
export function registerDataBindAttributes(
  id     : number, 
  content: DocumentFragment,
  rootId : number = id
): IDataBindAttributes[] {
  const dataBindAttributes = getDataBindAttributesFromTemplate(content);
  const paths = pathsSetById[rootId] ?? (pathsSetById[rootId] = new Set<string>());
  const listPaths = listPathsSetById[rootId] ?? (listPathsSetById[rootId] = new Set<string>());
  for(let i = 0; i < dataBindAttributes.length; i++) {
    const attribute = dataBindAttributes[i];
    for(let j = 0; j < attribute.bindTexts.length; j++) {
      const bindText = attribute.bindTexts[j];
      paths.add(bindText.stateProperty);
      if (bindText.nodeProperty === "for") {
        listPaths.add(bindText.stateProperty);
      }
    }
  }
  return listDataBindAttributesById[id] = dataBindAttributes;
}

/**
 * テンプレートIDからバインディング属性リストを取得
 */
export const getDataBindAttributesById = (id: number): IDataBindAttributes[] => {
  return listDataBindAttributesById[id];
}

/**
 * テンプレートIDからforバインディングのstateProperty集合を取得
 */
export const getListPathsSetById = (id: number): Set<string> => {
  return listPathsSetById[id] ?? [];
};

/**
 * テンプレートIDから全バインディングのstateProperty集合を取得
 */
export const getPathsSetById = (id: number): Set<string> => {
  return pathsSetById[id] ?? [];
};