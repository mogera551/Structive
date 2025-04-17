import { IBindContent } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "./types";
export declare function createLoopContext(pattern: string | null, listIndex: IListIndex, bindContent: IBindContent): ILoopContext;
