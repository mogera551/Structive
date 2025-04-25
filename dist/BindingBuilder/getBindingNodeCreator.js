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
import { raiseError } from "../utils.js";
import { createBindingNodeComponent } from "../DataBinding/BindingNode/BindingNodeComponent.js";
const nodePropertyConstructorByNameByIsComment = {
    0: {
        "class": createBindingNodeClassList,
        "checkbox": createBindingNodeCheckbox,
        "radio": createBindingNodeRadio,
    },
    1: {
        "if": createBindingNodeIf,
    },
};
const nodePropertyConstructorByFirstName = {
    "class": createBindingNodeClassName,
    "attr": createBindingNodeAttribute,
    "style": createBindingNodeStyle,
    "state": createBindingNodeComponent,
    //  "popover": PopoverTarget,
    //  "commandfor": CommandForTarget,
};
function _getBindingNodeCreator(isComment, isElement, propertyName) {
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
        }
        else {
            return createBindingNodeProperty;
        }
    }
    else {
        return createBindingNodeProperty;
    }
}
const _cache = {};
/**
 * バインドのノードプロパティの生成関数を取得する
 * @param node ノード
 * @param propertyName プロパティ名
 * @returns {CreateBindingNodeFn} ノードプロパティのコンストラクタ
 */
export function getBindingNodeCreator(node, propertyName, filterTexts, event) {
    const isComment = node instanceof Comment;
    const isElement = node instanceof Element;
    const key = isComment + "\t" + isElement + "\t" + propertyName;
    const fn = _cache[key] ?? (_cache[key] = _getBindingNodeCreator(isComment, isElement, propertyName));
    return fn(propertyName, filterTexts, event);
}
