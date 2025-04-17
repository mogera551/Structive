import { ILoopContext } from "../LoopContext/types";
import { IListIndex } from "../ListIndex/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { IBindingNode } from "./BindingNode/types";
import { IBindingState } from "./BindingState/types";
export interface IBindContent {
    loopContext: ILoopContext | null;
    parentBinding: IBinding | null;
    readonly isMounted: boolean;
    readonly id: number;
    readonly firstChildNode: Node | null;
    readonly lastChildNode: Node | null;
    readonly currentLoopContext: ILoopContext | null;
    mount(parentNode: Node): void;
    mountBefore(parentNode: Node, beforeNode: Node | null): void;
    mountAfter(parentNode: Node, afterNode: Node | null): void;
    unmount(): void;
    fragment: DocumentFragment;
    childNodes: Node[];
    bindings: IBinding[];
    render(): void;
    init(): void;
    assignListIndex(listIndex: IListIndex): void;
    getLastNode(parentNode: Node): Node | null;
}
export interface IBinding {
    parentBindContent: IBindContent;
    engine: IComponentEngine;
    node: Node;
    bindingNode: IBindingNode;
    bindingState: IBindingState;
    bindContents: Set<IBindContent>;
    render(): void;
    init(): void;
}
export type StateBindSummary = Map<string, WeakMap<ILoopContext, IBindContent>>;
