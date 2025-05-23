import { createBindingNodeAttribute } from "../DataBinding/BindingNode/BindingNodeAttribute.js";
import { createBindingNodeCheckbox } from "../DataBinding/BindingNode/BindingNodeCheckbox.js";
import { createBindingNodeClassList } from "../DataBinding/BindingNode/BindingNodeClassList.js";
import { createBindingNodeClassName } from "../DataBinding/BindingNode/BindingNodeClassName.js";
import { createBindingNodeEvent } from "../DataBinding/BindingNode/BindingNodeEvent.js";
import { createBindingNodeIf } from "../DataBinding/BindingNode/BindingNodeIf.js";
import { createBindingNodeFor } from "../DataBinding/BindingNode/BindingNodeFor.js";
import { createBindingNodeProperty } from "../DataBinding/BindingNode/BindingNodeProperty.js";
import { createBindingNodeRadio } from "../DataBinding/BindingNode/BindingNodeRadio.js";
import { createBindingNodeStyle } from "../DataBinding/BindingNode/BindingNodeStyle.js";
import { CreateBindingNodeByNodeFn, CreateBindingNodeFn } from "../DataBinding/BindingNode/types";
import { raiseError } from "../utils.js";
import { IFilterText } from "./types";
import { createBindingNodeComponent } from "../DataBinding/BindingNode/BindingNodeComponent.js";

type NodePropertyConstructorByName = {[key:string]:CreateBindingNodeFn};
type NodePropertyConstructorByNameByIsComment = {[key:number]:NodePropertyConstructorByName};

const nodePropertyConstructorByNameByIsComment:NodePropertyConstructorByNameByIsComment = {
  0: {
    "class"   : createBindingNodeClassList,
    "checkbox": createBindingNodeCheckbox,
    "radio"   : createBindingNodeRadio,
  },
  1: {
    "if" : createBindingNodeIf,
  },
};

type NodePropertyConstructorByFirstName = {[key:string]:CreateBindingNodeFn};

const nodePropertyConstructorByFirstName:NodePropertyConstructorByFirstName = {
  "class": createBindingNodeClassName,
  "attr" : createBindingNodeAttribute,
  "style": createBindingNodeStyle,
  "state": createBindingNodeComponent,
//  "popover": PopoverTarget,
//  "commandfor": CommandForTarget,
};

/**
 * バインディング対象ノードのプロパティ名やノード種別（Element/Comment）に応じて、
 * 適切なバインディングノード生成関数（CreateBindingNodeFn）を返すユーティリティ。
 *
 * - ノード種別やプロパティ名ごとに専用の生成関数をマッピング
 * - コメントノードや特殊プロパティ（for/if等）にも対応
 * - プロパティ名の先頭や"on"でイベントバインディングも判別
 * - 一度判定した組み合わせはキャッシュし、パフォーマンス向上
 *
 * これにより、テンプレートのdata-bindやコメントバインディングの各種ケースに柔軟に対応できる。
 */
function _getBindingNodeCreator(isComment:boolean, isElement: boolean, propertyName: string): CreateBindingNodeFn {
  // コメント/エレメント種別とプロパティ名で専用の生成関数を優先的に取得
  const bindingNodeCreatorByName = nodePropertyConstructorByNameByIsComment[isComment ? 1 : 0][propertyName];
  if (typeof bindingNodeCreatorByName !== "undefined") {
    return bindingNodeCreatorByName;
  }
  // コメントノードでforの場合は専用関数
  if (isComment && propertyName === "for") {
    return createBindingNodeFor;
  }
  // コメントノードで未対応プロパティはエラー
  if (isComment) {
    raiseError(`getBindingNodeCreator: unknown node property ${propertyName}`);
  }
  // プロパティ名の先頭で判別（class.attr.style.state等）
  const nameElements = propertyName.split(".");
  const bindingNodeCreatorByFirstName = nodePropertyConstructorByFirstName[nameElements[0]];
  if (typeof bindingNodeCreatorByFirstName !== "undefined") {
    return bindingNodeCreatorByFirstName;
  }
  // エレメントノードでonから始まる場合はイベントバインディング
  if (isElement) {
    if (propertyName.startsWith("on")) {
      return createBindingNodeEvent;
    } else {
      return createBindingNodeProperty;
    }
  } else {
    // それ以外は汎用プロパティバインディング
    return createBindingNodeProperty;
  }
}

const _cache: {[key:string]:CreateBindingNodeFn} = {};

/**
 * ノード・プロパティ名・フィルタ・デコレータ情報から
 * 適切なバインディングノード生成関数を取得し、呼び出すファクトリ関数。
 * 
 * @param node         バインディング対象ノード
 * @param propertyName バインディングプロパティ名
 * @param filterTexts  フィルタ情報
 * @param decorates    デコレータ情報
 * @returns            バインディングノード生成関数の実行結果
 */
export function getBindingNodeCreator(
  node        : Node, 
  propertyName: string,
  filterTexts : IFilterText[],
  decorates   : string[]
): CreateBindingNodeByNodeFn {
  const isComment = node instanceof Comment;
  const isElement = node instanceof Element;
  const key = isComment + "\t" + isElement + "\t" + propertyName;
  // キャッシュを利用して生成関数を取得
  const fn = _cache[key] ?? (_cache[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
  return fn(propertyName, filterTexts, decorates);
}
