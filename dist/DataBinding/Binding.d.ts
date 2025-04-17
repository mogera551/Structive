import { IComponentEngine } from "../ComponentEngine/types";
import { CreateBindingNodeByNodeFn } from "./BindingNode/types";
import { CreateBindingStateByStateFn } from "./BindingState/types";
import { IBindContent, IBinding } from "./types";
export declare function createBinding(parentBindContent: IBindContent, node: Node, engine: IComponentEngine, createBindingNode: CreateBindingNodeByNodeFn, createBindingState: CreateBindingStateByStateFn): IBinding;
