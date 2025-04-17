import { createBindingNodeAttribute } from "../DataBinding/BindingNode/BindingNodeAttribute";
import { createBindingNodeCheckbox } from "../DataBinding/BindingNode/BindingNodeCheckbox";
import { createBindingNodeClassList } from "../DataBinding/BindingNode/BindingNodeClassList";
import { createBindingNodeClassName } from "../DataBinding/BindingNode/BindingNodeClassName";
import { createBindingNodeEvent } from "../DataBinding/BindingNode/BindingNodeEvent";
import { createBindingNodeIf } from "../DataBinding/BindingNode/BindingNodeIf";
import { createBindingNodeFor } from "../DataBinding/BindingNode/BindingNodeFor";
import { createBindingNodeProperty } from "../DataBinding/BindingNode/BindingNodeProperty";
import { createBindingNodeRadio } from "../DataBinding/BindingNode/BindingNodeRadio";
import { createBindingNodeStyle } from "../DataBinding/BindingNode/BindingNodeStyle";
import { CreateBindingNodeByNodeFn, CreateBindingNodeFn } from "../DataBinding/BindingNode/types";
import { raiseError } from "../utils";
import { IFilterText } from "./types";

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
//  "props": ComponentProperty,
//  "popover": PopoverTarget,
//  "commandfor": CommandForTarget,
};

function _getBindingNodeCreator(isComment:boolean, isElement: boolean, propertyName: string): CreateBindingNodeFn {
  const bindingNodeCreatorByName = nodePropertyConstructorByNameByIsComment[isComment ? 1 : 0][propertyName];
  if (typeof bindingNodeCreatorByName !== "undefined") {
    return bindingNodeCreatorByName;
  }
  if (isComment && propertyName === "for") {
    return createBindingNodeFor;
  }
  if (isComment) {
    raiseError(`getBindingNodeCreator: unknown node property ${propertyName}`);
  }
  const nameElements = propertyName.split(".");
  const bindingNodeCreatorByFirstName = nodePropertyConstructorByFirstName[nameElements[0]];
  if (typeof bindingNodeCreatorByFirstName !== "undefined") {
    return bindingNodeCreatorByFirstName;
  }
  if (isElement) {
    if (propertyName.startsWith("on")) {
      return createBindingNodeEvent;
    } else {
      return createBindingNodeProperty;
    }
  } else {
    return createBindingNodeProperty;
  }
}

const _cache: {[key:string]:CreateBindingNodeFn} = {};

/**
 * バインドのノードプロパティの生成関数を取得する
 * @param node ノード
 * @param propertyName プロパティ名
 * @returns {CreateBindingNodeFn} ノードプロパティのコンストラクタ
 */
export function getBindingNodeCreator(
  node        : Node, 
  propertyName: string,
  filterTexts: IFilterText[],
  event       : string | null
): CreateBindingNodeByNodeFn {
  const isComment = node instanceof Comment;
  const isElement = node instanceof Element;
  const key = isComment + "\t" + isElement + "\t" + propertyName;
  const fn = _cache[key] ?? (_cache[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
  return fn(propertyName, filterTexts, event);
}
