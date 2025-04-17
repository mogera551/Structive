import { IBindContent } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
export interface ILoopContext {
    readonly path: string;
    readonly info: IStructuredPathInfo;
    readonly bindContent: IBindContent;
    readonly listIndex: IListIndex;
    readonly listIndexRef: WeakRef<IListIndex>;
    readonly parentLoopContext: ILoopContext | null;
    assignListIndex(listIndex: IListIndex): void;
    clearListIndex(): void;
    find(name: string): ILoopContext | null;
    walk(callback: (loopContext: ILoopContext) => void): void;
    serialize(): ILoopContext[];
}
