import { CreateBindingNodeByNodeFn } from "../DataBinding/BindingNode/types";
import { CreateBindingStateByStateFn } from "../DataBinding/BindingState/types";
export type NodeType = "HTMLElement" | "SVGElement" | "Text" | "Template";
export type NodePath = number[];
export interface IDataBindAttributes {
    nodeType: NodeType;
    nodePath: NodePath;
    bindTexts: IBindText[];
    creatorByText: Map<IBindText, IBindingCreator>;
}
export interface IFilterText {
    name: string;
    options: string[];
}
export interface IBindText {
    nodeProperty: string;
    stateProperty: string;
    inputFilterTexts: IFilterText[];
    outputFilterTexts: IFilterText[];
    event: string | null;
}
export interface IBindingCreator {
    createBindingNode: CreateBindingNodeByNodeFn;
    createBindingState: CreateBindingStateByStateFn;
}
